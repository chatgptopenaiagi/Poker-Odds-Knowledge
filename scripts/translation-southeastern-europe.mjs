import {catalog} from './translation-build.mjs';
catalog('hu','Játék|Esélylabor|Feladatok|Leosztások áttekintése|Haladás|Beállítások|Leosztás indítása|Következő leosztás|Dobás|Passz|Megadás|Nyitás|Emelés|All-in|Kassza|Zsetonhalom|Közös lapok|Te|Szünet|Folytatás|Egy lépés|Számítás mutatása|Válasz elrejtése|Gyakorlás|Tanulás|Előbb tippelj|Válasz ellenőrzése|Következő feladat|Visszajátszás|Haladás mentése|Mentés importálása|Haladás törlése|Mégse|Megerősítés|Kezdő nézet|Haladó nézet|Nyelv|Kevesebb mozgás|Helyes számítás|Olvasd el a magyarázatot|Válaszod|Számítás menete|Számítási pontosság|Próbálkozások|Játékzseton|Számítás…|Számítás leállítása|Ellenfél tartománya|Súly|Ismert lapok|Várható kasszarész|Feltételezések|Módszer|Minták|Kezdés',`
Hány lap alkotja a Hold’em értékelt kezét?
A♣ 2♦ 3♥ 4♠ 5♣: mi a sor legmagasabb értéke? Ász = 14.
Asztal K♣ K♦ 7♥ 4♠ 2♣; 1. hely A♥ Q♥, 2. hely A♠ J♠. Melyik hely nyer?
Asztal A♠ K♠ Q♠ J♠ T♠, három játékos. Hány százalék jár fejenként az oszthatatlan zsetonok előtt?
Négy kör látható a lapjaid és a flop között, más lap nem ismert. Hány kör céllap marad?
47 ismeretlen lap, 9 rögzített cél: hány százalék a következő lap találati esélye?
47 ismeretlen lap, 9 rögzített cél, két lap további döntés nélkül: hány százalék legalább egy találat esélye?
A turnön 46 ismeretlen lap és 9 cél marad. Hány százalék a river találati esélye?
Milyen közelítő százalékot ad a négyes szabály 9 flop-outra és két következő lapra?
Hány rendezetlen kétlapos kombináció választható 52 különböző lapból?
Hány konkrét QQ-kombináció van blokkolók nélkül?
Hány AKs-kombináció van blokkolók nélkül? s azonos színt jelent.
Hány AKo-kombináció van blokkolók nélkül? o különböző színt jelent.
A♠ 7♦ van nálad, más ász nem ismert. Hány AA-kombináció marad?
Két teljes kéz és három floplap ismert, más halott lap nincs. Hány rendezetlen turn/river-pár lehetséges?
Kassza 60, ellenfél tétje 20: P = 80, további megadás C = 20. Egy kassza, nincs későbbi tét: mekkora equity kell a nullszaldóhoz százalékban?
P = 80, C = 20, E = 25%, egy jogosult kassza, nincs jutalék vagy későbbi tét. Megadás EV-je a mostani dobáshoz képest?
P = 80, C = 20, E = 15%, nincs későbbi tét. Megadás EV-je?
Tiszta blöff: P0 = 100, B = 50, megadáskor nulla equity, nincs további döntés. Mekkora dobási százalék ad nullszaldót?
P0 = 100, B = 50, feltételezett dobási esély F = 40%, megadáskor nulla equity. Blöff EV-je?
100 egyformán valószínű eredmény: 30 önálló győzelem, 20 kétszemélyes döntetlen, 50 vereség. Equity százalékban?
A vakok előtt két játékosnak 240 és 90 zsetonja van. Mekkora az effektív stack?
Két játékos: 1. hely gomb/kisvak, 2. hely nagyvak. Mindketten léphetnek. Ki kezd preflop?
Modell: P = 80, C = 20, találati esély 10%. Találatkor biztos győzelem és további 100 az ellenféltől; különben vereség több fizetés nélkül. Megadás EV-je?
Alap-EV +5 zseton. Külön 10% eséllyel további 80 veszteség keletkezik, eddig nem számoltuk. Új EV?
Három játékos 30, 80 és 80 zsetont tesz be. Az első all-in. Mennyi a mindhárom által megnyerhető fő kassza?
Blokkolók nélkül csak AA 100% súllyal és KK 50% súllyal szerepel. Mekkora az AA normalizált százaléka?
9 flush-céllap és 8 sor-céllap, pontosan 2 mindkét halmazban. Hány különböző cél van?
`, `
A legjobb öt számít a hétből. Nulla, egy vagy két saját lap használható; nem hét lapot értékelünk együtt.
Az ász itt a kettes alatt áll. A sor nem fordulhat körbe az ászon át.
A K-K-A után a Q kísérőlap veri a J-t. A közös ász nem jelent döntetlent.
Mindenki ugyanazt a royal flusht játssza. Szín és saját lap nem bont döntetlent; a páratlan zsetonokra az asztalszabály vonatkozik.
A céllap nem garantál győzelmet. Az ellenfél is javulhat; páros asztal vagy magasabb flush számíthat.
A nevező az aktuálisan ismeretlen lapok száma. A cél eltalálása nem automatikusan győzelem.
Vonjuk ki egyből a két mellétalálás esélyét. Az egyszeri esély duplázása figyelmen kívül hagyja a lapkivételt és kétszer számol eredményeket.
Ez jelölt közelítés, nem pontos eredmény. Rögzített célokat és két ténylegesen látott lapot feltételez.
Ugyanazon két lap fordított sorrendje nem új kombináció. A 169 cella osztály, nem konkrét kéz.
Blokkolók előtti kombinációkat számolunk. s azonos szín, o eltérő; utótag nélkül mindkettő szerepel.
Csak ismert lapokat távolíts el, majd normalizáld a súlyokat. A szimulátor titkos lapjai nem ismert blokkolók.
A rendezetlen párok elegendők a végső equityhez; az utcánkénti döntésekhez sorrend kell.
Egy kassza, nincs jutalék vagy további tét. A megadás bekerül a végső kasszába; a múltbeli befizetést ne vond le újra. A későbbi szerencse nem módosítja a számítást.
A dobási gyakoriság feltételezés, nem bizonyított ellenféljellemző. A tiszta blöff csak a küszöb fölött pozitív.
A kétfős döntetlen fél kasszát ér. A győzelmi, döntetlen- és vereségi arány eltér az equitytől.
Egy ellenféllel csak a kisebb elérhető stackért lehet versenyezni.
A gomb/kisvak preflop első, flop után utolsó. A pozíció önmagában nem megoldott stratégia.
A pluszfizetéshez találat és győzelem kell. Valódi ellenfél lehet, hogy nem fizet; saját későbbi költség és piszkos out is számít.
A várható többletveszteséget egyszer vond le. A nyers equity nem jósolja meg ezt a feltételezett későbbi fizetést.
Minden kasszát csak jogosult játékos nyerhet. Fő- és mellékkasszához külön equity kell.
A súly kombinációnként értendő, az összeggel osztjuk. A cellasúly még nem a végső valószínűség.
A metszetet egyszer vond le a kettős számolás ellen. A különböző célok sem feltétlenül tiszta nyerő outok.
`);
catalog('sl','Igraj|Laboratorij verjetnosti|Vaje|Pregled rok|Napredek|Nastavitve|Začni roko|Naslednja roka|Odstopi|Preveri|Izenači|Stavi|Višaj|Vse v igro|Pot|Kup žetonov|Skupne karte|Ti|Premor|Nadaljuj|En korak|Pokaži izračun|Skrij odgovor|Vadba|Učenje|Najprej odgovori|Preveri odgovor|Naslednja vaja|Ponovi|Varnostno kopiraj napredek|Uvozi kopijo|Ponastavi napredek|Prekliči|Potrdi|Začetniški pogled|Napredni pogled|Jezik|Manj gibanja|Pravilen izračun|Preberi razlago|Tvoj odgovor|Postopek izračuna|Natančnost računanja|Poskusi|Igralni žetoni|Računanje…|Ustavi izračun|Razpon nasprotnika|Utež|Znane karte|Pričakovani delež pota|Predpostavke|Metoda|Vzorci|Začni',`
Koliko kart sestavlja ocenjevano roko v Hold’emu?
A♣ 2♦ 3♥ 4♠ 5♣: katera je najvišja vrednost te lestvice? As = 14.
Miza K♣ K♦ 7♥ 4♠ 2♣; sedež 1 A♥ Q♥, sedež 2 A♠ J♠. Kateri sedež zmaga?
Miza A♠ K♠ Q♠ J♠ T♠, trije igralci. Kolikšen odstotek pota pripada vsakemu pred nedeljivimi žetoni?
Med tvojimi kartami in flopom so vidni štirje srci, drugih kart ne poznaš. Koliko ciljnih src ostane?
47 neznanih kart, 9 stalnih ciljev: odstotek zadetka z naslednjo karto?
47 neznanih kart, 9 stalnih ciljev, dve karti brez nadaljnjih odločitev: odstotek vsaj enega zadetka?
Na turnu je 46 neznanih kart in 9 ciljev. Odstotek zadetka na riverju?
Kolikšen približen odstotek da pravilo štirih za 9 outs na flopu in dve prihodnji karti?
Koliko neurejenih parov lahko izbereš iz 52 različnih kart?
Koliko konkretnih kombinacij QQ je brez blokatorjev?
Koliko kombinacij AKs brez blokatorjev? s pomeni isto barvo.
Koliko kombinacij AKo brez blokatorjev? o pomeni različni barvi.
Imaš A♠ 7♦, drugih asov ne poznaš. Koliko kombinacij AA ostane?
Znani sta dve celotni roki in tri karte flopa, brez drugih mrtvih kart. Koliko neurejenih parov turn/river?
Pot 60, nasprotnik stavi 20: P = 80, dodatno izenačenje C = 20. En pot, brez prihodnjih stav: odstotek equity za ničelni izid?
P = 80, C = 20, E = 25%, en upravičen pot, brez provizije in prihodnjih stav. EV izenačenja glede na odstop zdaj?
P = 80, C = 20, E = 15%, brez prihodnjih stav. EV izenačenja?
Čisti blef: P0 = 100, B = 50, nič equity ob izenačenju, brez prihodnjih odločitev. Odstotek odstopov za ničelni EV?
P0 = 100, B = 50, predpostavljen odstop F = 40%, nič equity ob izenačenju. EV blefa?
100 enako verjetnih izidov: 30 samostojnih zmag, 20 delitev med dvema, 50 porazov. Equity v odstotkih?
Pred slepimi stavami imata igralca 240 in 90 žetonov. Efektivni kup?
Dva igralca: sedež 1 gumb/mala slepa, sedež 2 velika slepa. Oba lahko ukrepata. Kdo prvi pred flopom?
Model: P = 80, C = 20, zadetek 10%. Ob zadetku vedno zmaga in dodatnih 100 od nasprotnika; sicer poraz brez doplačila. EV izenačenja?
Osnovni EV +5 žetonov. Ločeno obstaja 10% možnost dodatne izgube 80, še neupoštevane. Novi EV?
Trije vložijo 30, 80 in 80 žetonov. Prvi je all-in. Kolikšen je glavni pot za vse tri?
Brez blokatorjev razpon vsebuje samo AA z utežjo 100% in KK s 50%. Normalizirani odstotek AA?
9 ciljev za barvo in 8 za lestvico; natanko 2 karti pripadata obema. Koliko različnih ciljev?
`, `
Šteje najboljših pet od sedmih. Uporabiš lahko nič, eno ali dve lastni karti; sedmih ne ocenjujemo skupaj.
As je tukaj pod dvojko. Lestvica ne sme krožiti prek asa.
Po K-K-A odloči spremljevalna karta Q proti J. Skupni as ne pomeni izenačenja.
Vsi igrajo isto kraljevo lestvico v barvi. Barva in lastne karte ne prelomijo izenačenja; lihe žetone določa pravilo mize.
Ciljne karte ne zagotavljajo zmage. Tudi nasprotnik se lahko izboljša; par na mizi ali višja barva sta lahko pomembna.
Imenovalec uporablja trenutno neznane karte. Zadetek cilja ni samodejna zmaga.
Od ena odštej možnost dveh zgrešenih kart. Podvojitev enkratne možnosti prezre odstranjevanje in dvakrat šteje izide.
To je označen približek, ne natančen rezultat. Predpostavlja stalne cilje in dejanski ogled dveh kart.
Obrnjeni vrstni red istih kart ni nova kombinacija. 169 celic je razredov, ne konkretnih rok.
Štej kombinacije pred blokatorji. s vključuje isto barvo, o različni; brez pripone oboje.
Odstrani samo znane karte in normaliziraj uteži. Skrivne karte simulatorja niso znani blokatorji.
Neurejeni pari zadoščajo za končno equity; odločitve po ulicah potrebujejo vrstni red.
En pot, brez provizije in nadaljnjih stav. Izenačenje gre v končni pot; preteklih vložkov ne odštevaj znova. Poznejša sreča ne spremeni izračuna.
Pogostost odstopa je predpostavka, ne dokazana lastnost nasprotnika. Čisti blef je pozitiven šele nad pragom.
Delitev med dvema šteje kot polovica pota. Pogostosti zmag, delitev in porazov se razlikujejo od equity.
Proti nasprotniku lahko tekmuješ le za manjši razpoložljivi kup.
Gumb/mala slepa ukrepa prvi pred flopom in zadnji po njem. Položaj sam ne daje rešene strategije.
Dodatno plačilo zahteva zadetek in zmago. Resnični nasprotnik morda ne plača; upoštevati je treba lastne prihodnje stroške in nečiste outs.
Pričakovano dodatno izgubo odštej enkrat. Surova equity ne napoveduje tega predpostavljenega prihodnjega plačila.
Vsak pot lahko osvojijo le upravičeni igralci. Glavni in stranski pot potrebujeta ločeno equity.
Uteži veljajo za vsako kombinacijo in se delijo z vsoto. Utež celice ni končna verjetnost.
Presek odštej enkrat, da preprečiš dvojno štetje. Različni cilji niso nujno čisti zmagovalni outs.
`);
catalog('hr','Igraj|Laboratorij vjerojatnosti|Vježbe|Pregled ruku|Napredak|Postavke|Započni ruku|Sljedeća ruka|Odustani|Provjeri|Izjednači|Uloži|Povećaj|Sve u igru|Pot|Hrpa žetona|Zajedničke karte|Ti|Pauza|Nastavi|Jedan korak|Prikaži izračun|Sakrij odgovor|Vježbanje|Učenje|Prvo odgovori|Provjeri odgovor|Sljedeća vježba|Ponovi|Sigurnosno kopiraj napredak|Uvezi kopiju|Poništi napredak|Odustani|Potvrdi|Početnički prikaz|Napredni prikaz|Jezik|Smanji kretanje|Točan izračun|Pročitaj objašnjenje|Tvoj odgovor|Postupak računanja|Točnost računanja|Pokušaji|Žetoni za igru|Računanje…|Zaustavi računanje|Raspon protivnika|Težina|Poznate karte|Očekivani dio pota|Pretpostavke|Metoda|Uzorci|Počni',`
Koliko karata čini ocijenjenu ruku u Hold’emu?
A♣ 2♦ 3♥ 4♠ 5♣: koji je najviši rang ove skale? As = 14.
Stol K♣ K♦ 7♥ 4♠ 2♣; mjesto 1 A♥ Q♥, mjesto 2 A♠ J♠. Koje mjesto pobjeđuje?
Stol A♠ K♠ Q♠ J♠ T♠, tri igrača. Koliki postotak pota pripada svakome prije nedjeljivih žetona?
Četiri srca vidljiva među tvojim kartama i flopom, druge karte nisu poznate. Koliko ciljanih srca ostaje?
47 nepoznatih karata, 9 stalnih ciljeva: postotak pogotka sljedećom kartom?
47 nepoznatih karata, 9 stalnih ciljeva, dvije karte bez daljnjih odluka: postotak barem jednog pogotka?
Na turnu je 46 nepoznatih karata i 9 ciljeva. Postotak pogotka na riveru?
Koji približni postotak daje pravilo četiri za 9 outova na flopu i dvije buduće karte?
Koliko neuređenih parova možeš izabrati iz 52 različite karte?
Koliko konkretnih kombinacija QQ bez blokatora?
Koliko kombinacija AKs bez blokatora? s znači istu boju.
Koliko kombinacija AKo bez blokatora? o znači različite boje.
Imaš A♠ 7♦, drugi asovi nisu poznati. Koliko kombinacija AA ostaje?
Poznate su dvije potpune ruke i tri karte flopa, bez drugih mrtvih karata. Koliko neuređenih parova turn/river?
Pot 60, protivnik ulaže 20: P = 80, dodatno izjednačenje C = 20. Jedan pot, bez budućih uloga: postotak equity za nulu?
P = 80, C = 20, E = 25%, jedan dostupan pot, bez provizije i budućih uloga. EV izjednačenja u odnosu na odustajanje sada?
P = 80, C = 20, E = 15%, bez budućih uloga. EV izjednačenja?
Čisti blef: P0 = 100, B = 50, nula equity ako protivnik prati, bez daljnjih odluka. Postotak odustajanja za nulti EV?
P0 = 100, B = 50, pretpostavljeno odustajanje F = 40%, nula equity ako protivnik prati. EV blefa?
100 jednako vjerojatnih ishoda: 30 samostalnih pobjeda, 20 podjela između dvojice, 50 poraza. Equity u postocima?
Prije blindova dva igrača imaju 240 i 90 žetona. Efektivna hrpa?
Dva igrača: mjesto 1 gumb/mali blind, mjesto 2 veliki blind. Obojica mogu djelovati. Tko prvi prije flopa?
Model: P = 80, C = 20, pogodak 10%. Pogodak uvijek donosi pobjedu i dodatnih 100 od protivnika; promašaj poraz bez dodatne uplate. EV izjednačenja?
Osnovni EV +5 žetona. Odvojeno postoji 10% mogućnosti dodatnog gubitka 80, još neuračunatog. Novi EV?
Tri igrača ulažu 30, 80 i 80 žetona. Prvi je all-in. Koliki je glavni pot dostupan svoj trojici?
Bez blokatora raspon sadrži samo AA s težinom 100% i KK s 50%. Normalizirani postotak AA?
9 ciljeva za boju i 8 za skalu; točno 2 karte pripadaju objema skupinama. Koliko različitih ciljeva?
`, `
Računa se najboljih pet od sedam. Možeš upotrijebiti nula, jednu ili dvije vlastite karte; sedam se ne ocjenjuje zajedno.
As je ovdje ispod dvojke. Skala ne smije kružiti preko asa.
Nakon K-K-A odlučuje kicker Q protiv J. Zajednički as ne znači izjednačenje.
Svi igraju istu kraljevsku skalu u boji. Boja i vlastite karte ne razrješavaju izjednačenje; neparne žetone određuje pravilo stola.
Ciljne karte ne jamče pobjedu. Protivnik se također može poboljšati; par na stolu ili viša boja mogu biti važni.
Nazivnik koristi trenutačno nepoznate karte. Pogoditi cilj nije automatski pobijediti.
Od jedan oduzmi mogućnost dva promašaja. Udvostručenje pojedinačne mogućnosti zanemaruje uklanjanje i dvaput broji ishode.
Ovo je označena aproksimacija, ne točan rezultat. Pretpostavlja stalne ciljeve i stvarno gledanje dviju karata.
Obrnuti redoslijed istih karata nije nova kombinacija. 169 ćelija su klase, ne konkretne ruke.
Broji kombinacije prije blokatora. s obuhvaća istu boju, o različite; bez nastavka oboje.
Ukloni samo poznate karte pa normaliziraj težine. Tajne karte simulatora nisu poznati blokatori.
Neuređeni parovi dovoljni su za završni equity; odluke po ulicama zahtijevaju redoslijed.
Jedan pot, bez provizije i daljnjih uloga. Izjednačenje ulazi u završni pot; stare uplate ne oduzimaj opet. Kasnija sreća ne mijenja izračun.
Učestalost odustajanja je pretpostavka, ne dokazana osobina protivnika. Čisti blef pozitivan je tek iznad praga.
Podjela između dvojice vrijedi pola pota. Učestalosti pobjede, podjele i poraza razlikuju se od equityja.
Protiv jednog protivnika može se igrati samo za manju dostupnu hrpu.
Gumb/mali blind djeluje prvi prije flopa i posljednji nakon njega. Pozicija sama nije riješena strategija.
Dodatna uplata zahtijeva pogodak i pobjedu. Stvarni protivnik možda neće platiti; budući vlastiti troškovi i nečisti outovi moraju se uračunati.
Očekivani dodatni gubitak oduzmi jednom. Sirovi equity ne predviđa ovu pretpostavljenu buduću uplatu.
Svaki pot mogu osvojiti samo ovlašteni igrači. Glavni i sporedni pot trebaju odvojeni equity.
Težine vrijede po kombinaciji i dijele se ukupnim zbrojem. Težina ćelije nije završna vjerojatnost.
Presjek oduzmi jednom radi izbjegavanja dvostrukog brojanja. Različiti ciljevi nisu nužno čisti pobjednički outovi.
`);
