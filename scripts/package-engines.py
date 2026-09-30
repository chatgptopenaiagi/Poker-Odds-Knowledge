"""Package only reviewed public assets, source, native runtime and sanitized evidence.
No Git history, browser notebooks, account DBs, private CLA records or credentials.
"""
from pathlib import Path
import hashlib, json, re, subprocess, zipfile

ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'engine-dist'
OUT=ROOT/'artifacts'/'engine-release'
OUT.mkdir(parents=True,exist_ok=True)
commit=subprocess.check_output(['git','-C',str(ROOT),'rev-parse','HEAD'],text=True).strip()
assert Path(subprocess.check_output(['git','-C',str(ROOT),'rev-parse','--show-toplevel'],text=True).strip()).resolve()==ROOT
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
secret=re.compile(rb'(?:sk-(?:proj-)?[A-Za-z0-9_-]{30,}|gh[pousr]_[A-Za-z0-9]{30,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)')
forbidden={'.git','node_modules','.venv','.pok-local','.data','__pycache__'}
def audit(name,data):
    parts=Path(name).parts
    assert not any(x in forbidden for x in parts),name
    assert not any(x=='..' for x in parts) and not Path(name).is_absolute(),name
    assert not name.endswith(('.sqlite','.sqlite-wal','.sqlite-shm','.log','.pdb','.obj')),name
    assert not secret.search(data),f'Secret-shaped value in {name}'
    assert not re.search(rb'(?:CLA session ID|snapshot_id)[\s"\x27:=]+[a-f0-9]{32}',data,re.I),f'Private launch ID in {name}'
    assert not re.search(rb'[A-Z]:\\Users\\[^\\\r\n"]+\\AppData',data,re.I),f'Private application evidence path in {name}'
def package(filename,files):
    target=OUT/filename
    with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as z:
        for name,path in sorted(files.items()):
            data=path.read_bytes();audit(name,data);z.writestr(name,data)
    with zipfile.ZipFile(target) as z:
        assert z.testzip() is None
        for name in z.namelist():audit(name,z.read(name));assert z.read(name)==files[name].read_bytes()
    return {'file':filename,'bytes':target.stat().st_size,'sha256':sha(target),'members':len(files),'reopenedAndVerified':True}

public={p.relative_to(DIST).as_posix():p for p in DIST.rglob('*') if p.is_file()}
assert 'index.html' in public and 'engines/ph-evaluator.wasm' in public
assert all(Path(name).suffix in {'.html','.js','.css','.svg','.png','.ico','.txt','.json','.wasm'} or name=='.htaccess' for name in public)
records=[package('POK-Analysis-Preview-browser-1.0.0.zip',public)]

native={
    'pok-ompeval.exe':ROOT/'native/bin/pok-ompeval.exe',
    'build-manifest.json':ROOT/'native/bin/build-manifest.json',
    'LICENSE-OMPEval.txt':ROOT/'vendor/ompeval/LICENSE.txt',
    'LICENSE-libdivide.txt':ROOT/'vendor/ompeval/LICENSE-libdivide.txt',
    'LICENSE-nlohmann-json.txt':ROOT/'native/vendor/nlohmann/LICENSE.MIT',
    'ENGINE_USER_GUIDE.md':ROOT/'ENGINE_USER_GUIDE.md',
    'OMPEVAL_BUILD.md':ROOT/'docs/OMPEVAL_BUILD.md',
    'example.json':ROOT/'native/example.json',
}
records.append(package('POK-OMPEval-native-reference-1.0.0.zip',native))

source={}
for directory in ['src','server','schemas','vendor','tests','public']:
    for p in (ROOT/directory).rglob('*'):
        if p.is_file():source[p.relative_to(ROOT).as_posix()]=p
for p in (ROOT/'native').rglob('*'):
    if p.is_file() and 'bin' not in p.relative_to(ROOT/'native').parts:source[p.relative_to(ROOT).as_posix()]=p
for p in (ROOT/'scripts').iterdir():
    if p.is_file() and p.name not in {'audit-publication.py','package-release.py','Deploy-Holdem-Lab.ps1','verify-deployment.ps1'}:source[p.relative_to(ROOT).as_posix()]=p
for p in (ROOT/'docs').iterdir():
    if p.is_file() and p.name not in {'ENVIRONMENT.md','POK_PUBLICATION.md','MATH_VALIDATION.md'}:source[p.relative_to(ROOT).as_posix()]=p
for name in ['AGENTS.md','.gitignore','.gitattributes','package.json','package-lock.json','index.html','tsconfig.json','vite.config.ts','vitest.config.ts','playwright.engines.config.ts','playwright.config.ts','playwright.appearance.config.ts','playwright.online.config.ts','requirements-verification.txt','POK_README.md','AUTH_PROVIDERS.md','THIRD_PARTY_NOTICES.md','Open-POK-Engine-Preview.ps1','Open-Poker-Odds-Knowledge.ps1','Open-Holdem-Lab.ps1','POKER_ENGINE_RESEARCH.md','STRATEGY_ENGINE_ROADMAP.md','ENGINE_USER_GUIDE.md','ENGINE_INTEGRATION_REPORT.md','ENGINE_LICENSES.md','ENGINE_COMPARISON.json','ENGINE_BENCHMARKS.json','ENGINE_DISAGREEMENTS.json']:
    source[name]=ROOT/name
source['README.md']=ROOT/'ENGINE_USER_GUIDE.md'
records.append(package('POK-Analysis-Preview-source-1.0.0.zip',source))
evidence={name:ROOT/name for name in ['ENGINE_INTEGRATION_REPORT.md','ENGINE_COMPARISON.json','ENGINE_BENCHMARKS.json','ENGINE_DISAGREEMENTS.json','docs/ENGINE_TEST_RESULTS.json','docs/PH_CENSUS.json','docs/PH_POKERKIT_VERIFICATION.json','docs/OMPEVAL_VERIFICATION.json','docs/ENGINE_LANGUAGE_COVERAGE.md']}
for p in (ROOT/'artifacts/engine-screenshots').glob('*.png'):evidence['screenshots/'+p.name]=p
records.append(package('POK-Analysis-Preview-evidence-1.0.0.zip',evidence))

# Exercise the exact optional runtime extracted from the produced ZIP after hashing.
verify=OUT/'verified-native'
verify.mkdir(exist_ok=True)
with zipfile.ZipFile(OUT/records[1]['file']) as z:
    for name in ['pok-ompeval.exe','build-manifest.json']:(verify/name).write_bytes(z.read(name))
assert sha(verify/'pok-ompeval.exe')==sha(ROOT/'native/bin/pok-ompeval.exe')
probe=subprocess.run([str(verify/'pok-ompeval.exe')],input=b'{"schema":1,"op":"info"}',capture_output=True,timeout=5,creationflags=subprocess.CREATE_NO_WINDOW)
assert probe.returncode==0 and json.loads(probe.stdout)['engine']=='ompeval'
manifest={'schemaVersion':1,'product':'Poker Odds Knowledge','buildId':'POK-ENGINES-1.0.0-preview-'+commit[:7],'commit':commit,'branch':'feature/selectable-analysis','sourceDirectory':str(ROOT),'servedDirectory':'C:\\xampp\\htdocs\\holdem-engines-preview','verifiedUrl':'http://localhost/holdem-engines-preview/','defaultSiteUnchanged':True,'remotePublication':'NOT_RUN / prohibited by current mission','archives':records,'phWasmSha256':sha(DIST/'engines/ph-evaluator.wasm'),'nativeExeSha256':sha(ROOT/'native/bin/pok-ompeval.exe'),'nativeExtractedInfoProbe':'PASS','publicFiles':len(public),'excluded':['Git history','private CLA reports/snapshots','environment inventory','browser notebooks','account databases','build logs','credentials'],'licenses':'ENGINE_LICENSES.md; public upstream author contacts only within required notices; no new public POK license','tests':'docs/ENGINE_TEST_RESULTS.json','limitations':'ENGINE_INTEGRATION_REPORT.md'}
(OUT/'ENGINE_ARTIFACT_MANIFEST.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
(OUT/'SHA256SUMS.txt').write_text(''.join(f"{r['sha256']}  {r['file']}\n" for r in records),encoding='utf-8')
print(json.dumps(manifest,indent=2))
