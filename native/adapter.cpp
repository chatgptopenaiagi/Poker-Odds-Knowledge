// POK adapter, independently authored. See vendor provenance for the URBG portability patch.
#define WIN32_LEAN_AND_MEAN
#define NOMINMAX
#include <Windows.h>
#undef INFINITE
#include <nlohmann/json.hpp>
#include "omp/EquityCalculator.h"
#include <iostream>
#include <set>
#include <string>
#include <mutex>
#include <algorithm>
#include <chrono>
#include <atomic>
#include <thread>

using json = nlohmann::json;
using Clock = std::chrono::steady_clock;
constexpr const char* revision = "4aec210ff75b0851af0ee170b35a7899e1a4fe8f";
constexpr uint64_t stateCap = 250000;
constexpr size_t inputCap = 262144;
std::mutex outputMutex;
void emit(const json& j) { std::lock_guard<std::mutex> lock(outputMutex); std::cout << j.dump() << '\n' << std::flush; }
[[noreturn]] void fail(const char* code) { throw std::runtime_error(code); }
void keys(const json& j, std::initializer_list<const char*> allowed) {
    if (!j.is_object()) fail("invalid_object");
    for (auto it=j.begin();it!=j.end();++it) if (std::find(allowed.begin(),allowed.end(),it.key())==allowed.end()) fail("unknown_field");
}
int integer(const json& j, int lo, int hi) { if (!j.is_number_integer() || j < lo || j > hi) fail("invalid_integer"); return j.get<int>(); }
int convert(int card) { const int suits[4]={2,3,1,0}; return (card/4)*4+suits[card%4]; }
uint64_t maskOf(const json& j, size_t lo, size_t hi) {
    if (!j.is_array() || j.size()<lo || j.size()>hi) fail("invalid_cards");
    uint64_t mask=0;
    for (const auto& card:j) { auto bit=1ull<<convert(integer(card,0,51)); if (mask&bit) fail("duplicate_card"); mask|=bit; }
    return mask;
}
uint64_t choose(unsigned n,unsigned k) { if(k>n)return 0; uint64_t c=1; for(unsigned i=1;i<=k;++i)c=c*(n-k+i)/i;return c; }
unsigned popcount(uint64_t n) { unsigned r=0;while(n){n&=n-1;++r;}return r; }
json metadata() { return {{"schema",1},{"engine","ompeval"},{"revision",revision},{"adapterVersion","1.0.0"},{"cardEncoding","POK:rank2..A,suits-cdhs"},{"threads",1},{"maxStates",stateCap},{"memoryLimitBytes",268435456},{"seed",nullptr},{"compiler",__clang_version__}}; }

// This job belongs only to this child process. It cannot affect another application.
HANDLE memoryJob() {
    HANDLE job=CreateJobObjectW(nullptr,nullptr); if(!job)fail("memory_guard_unavailable");
    JOBOBJECT_EXTENDED_LIMIT_INFORMATION limits{};
    limits.BasicLimitInformation.LimitFlags=JOB_OBJECT_LIMIT_PROCESS_MEMORY;
    limits.ProcessMemoryLimit=268435456;
    if(!SetInformationJobObject(job,JobObjectExtendedLimitInformation,&limits,sizeof(limits)) || !AssignProcessToJobObject(job,GetCurrentProcess())) {CloseHandle(job);fail("memory_guard_unavailable");}
    return job;
}

json run(const json& request) {
    if (!request.contains("schema") || request["schema"]!=1 || !request.contains("op") || !request["op"].is_string()) fail("invalid_request");
    const std::string op=request["op"];
    json result=metadata(); result["type"]="result"; result["ok"]=true;
    if(op=="info") { keys(request,{"schema","op"}); result["operations"]={"evaluate","equity"}; result["monteCarlo"]=false;result["weightedRanges"]=false;result["sidePots"]=false;result["memoryGuard"]="Windows job process limit"; return result; }
    if(op=="evaluate") {
        keys(request,{"schema","op","hands"});
        const auto& hands=request.at("hands"); if(!hands.is_array()||hands.empty()||hands.size()>10000)fail("invalid_hands");
        omp::HandEvaluator evaluator;
        json ranks=json::array();
        for(const auto& cards:hands) { maskOf(cards,5,7); omp::Hand hand=omp::Hand::empty();for(const auto& card:cards)hand+=omp::Hand(convert(card.get<int>())); ranks.push_back(evaluator.evaluate(hand)); }
        result["ranks"]=ranks; result["rankOrder"]="higher-is-better";result["categoryDivisor"]=4096;return result;
    }
    if(op!="equity")fail("unsupported_operation");
    keys(request,{"schema","op","ranges","board","dead","maxStates","deadlineMs"});
    int deadline=integer(request.at("deadlineMs"),100,15000);
    uint64_t cap=integer(request.at("maxStates"),1,static_cast<int>(stateCap));
    const auto& board=request.at("board"); auto boardMask=maskOf(board,0,5); if(board.size()==1||board.size()==2)fail("invalid_board");
    const auto& dead=request.at("dead"); auto deadMask=maskOf(dead,0,40);if(boardMask&deadMask)fail("duplicate_card");
    const auto& input=request.at("ranges");if(!input.is_array()||input.size()<2||input.size()>6)fail("invalid_ranges");
    if(52-board.size()-dead.size()<2*input.size()+5-board.size())fail("insufficient_cards");
    const uint64_t runouts=choose(static_cast<unsigned>(52-board.size()-dead.size()-2*input.size()),static_cast<unsigned>(5-board.size()));
    if(runouts>cap)fail("state_budget_exceeded");
    std::vector<omp::CardRange> ranges;
    std::vector<std::vector<uint64_t>> masks;
    uint64_t product=1;
    json kept=json::array();
    for(const auto& range:input) {
        if(!range.is_array()||range.empty()||range.size()>1326)fail("invalid_range");
        std::set<uint64_t> unique;std::vector<std::array<uint8_t,2>> combos;std::vector<uint64_t> seatMasks;
        for(const auto& combo:range) {auto mask=maskOf(combo,2,2);if(!unique.insert(mask).second)fail("duplicate_combination");if(mask&(boardMask|deadMask))continue;
            combos.push_back({static_cast<uint8_t>(convert(combo[0].get<int>())),static_cast<uint8_t>(convert(combo[1].get<int>()))});seatMasks.push_back(mask);
        }
        if(combos.empty())fail("empty_range_after_blockers");
        if(product>cap/runouts/combos.size())fail("state_budget_exceeded");
        product*=combos.size();ranges.emplace_back(combos);masks.push_back(seatMasks);kept.push_back(combos.size());
    }
    uint64_t assignments=0;
    std::function<void(size_t,uint64_t)> count=[&](size_t seat,uint64_t used){if(seat==masks.size()){++assignments;return;}for(auto m:masks[seat])if(!(m&used))count(seat+1,used|m);};
    count(0,boardMask|deadMask);if(!assignments)fail("impossible_joint_ranges");
    const uint64_t expected=assignments*runouts;
    omp::EquityCalculator calculator;
    calculator.setTimeLimit(deadline/1000.0);
    const auto begin=Clock::now();std::atomic<bool> done{false};std::atomic<bool> timedOut{false};
    if(!calculator.start(ranges,boardMask,deadMask,true,0,[&](const omp::EquityCalculator::Results& r){emit({{"type","progress"},{"states",r.hands},{"expectedStates",expected},{"progress",std::min(1.0,double(r.hands)/expected)}});},0.1,1)) fail("native_start_failed");
    // stop() is followed by wait(); a stuck native call is terminated after a bounded grace period.
    std::thread watchdog([&]{while(!done){auto elapsed=std::chrono::duration_cast<std::chrono::milliseconds>(Clock::now()-begin).count();if(elapsed>deadline){timedOut=true;calculator.stop();}if(elapsed>deadline+500){emit({{"type","result"},{"ok",false},{"code","native_timeout"}});TerminateProcess(GetCurrentProcess(),124);}std::this_thread::sleep_for(std::chrono::milliseconds(10));}});
    calculator.wait();done=true;watchdog.join();
    const auto r=calculator.getResults();
    if(timedOut||r.hands!=expected)fail("incomplete_enumeration");
    uint64_t total=0;json winsByMask=json::array();for(unsigned m=0;m<(1u<<input.size());++m){total+=r.winsByPlayerMask[m];winsByMask.push_back(r.winsByPlayerMask[m]);}
    if(total!=expected||r.winsByPlayerMask[0])fail("outcome_count_mismatch");
    json players=json::array();
    for(unsigned p=0;p<input.size();++p) {uint64_t wins=r.winsByPlayerMask[1u<<p],ties=0;double tieShare=0;for(unsigned m=1;m<(1u<<input.size());++m)if((m&(1u<<p))&&popcount(m)>1){ties+=r.winsByPlayerMask[m];tieShare+=double(r.winsByPlayerMask[m])/popcount(m);}players.push_back({{"equity",(wins+tieShare)/expected},{"wins",wins},{"ties",ties},{"losses",expected-wins-ties},{"tieShare",tieShare}});}
    result["method"]="EXACT_ENUMERATION";result["states"]=r.hands;result["expectedStates"]=expected;result["compatibleAssignments"]=assignments;result["runoutsPerAssignment"]=runouts;result["rangeCombinationCounts"]=kept;result["players"]=players;result["winsByPlayerMask"]=winsByMask;result["evaluations"]=r.evaluations;result["elapsedMs"]=std::chrono::duration<double,std::milli>(Clock::now()-begin).count();result["uncertainty"]=nullptr;
    result["limitations"]={"Unweighted joint compatible combinations only","No side-pot calculation","No native Monte Carlo; seed is not applicable","Conservative Cartesian state precheck may reject collision-heavy ranges"};return result;
}

int main() {
    HANDLE job=nullptr;
    try {
        job=memoryJob();std::string input;char ch;while(std::cin.get(ch)){if(input.size()>=inputCap)fail("input_too_large");input.push_back(ch);}
        std::set<std::string> seen;bool invalid=false;
        auto request=json::parse(input,[&](int depth,json::parse_event_t event,json& parsed){if(depth>5)fail("invalid_json_structure");if(event==json::parse_event_t::key&&!seen.insert(parsed.get<std::string>()).second)invalid=true;return true;});
        if(invalid)fail("invalid_json_structure");auto result=run(request);JOBOBJECT_EXTENDED_LIMIT_INFORMATION measured{};if(QueryInformationJobObject(job,JobObjectExtendedLimitInformation,&measured,sizeof(measured),nullptr))result["peakProcessMemoryBytes"]=measured.PeakProcessMemoryUsed;emit(result);if(job)CloseHandle(job);return 0;
    } catch(const std::exception& e) {std::string code=e.what();if(code.find("[json.exception")!=std::string::npos)code="invalid_json";emit({{"type","result"},{"schema",1},{"ok",false},{"code",code}});if(job)CloseHandle(job);return 2;}
}
