import {catalog} from './translation-build.mjs';
catalog('pl','Graj|Laboratorium szans|Ćwiczenia|Przegląd rozdań|Postępy|Ustawienia|Rozpocznij rozdanie|Następne rozdanie|Pas|Czekaj|Sprawdź|Postaw|Podbij|All-in|Pula|Stos|Karty wspólne|Ty|Pauza|Kontynuuj|Jeden krok|Pokaż obliczenie|Ukryj odpowiedź|Praktyka|Nauka|Najpierw odpowiedz|Sprawdź odpowiedź|Następne ćwiczenie|Odtwórz|Zapisz kopię postępów|Importuj kopię|Wyzeruj postępy|Anuluj|Potwierdź|Widok początkujący|Widok zaawansowany|Język|Ogranicz ruch|Poprawne obliczenie|Przeczytaj wyjaśnienie|Twoja odpowiedź|Tok obliczeń|Dokładność obliczeń|Próby|Żetony treningowe|Obliczanie…|Zatrzymaj obliczenie|Zakres przeciwnika|Waga|Znane karty|Oczekiwany udział w puli|Założenia|Metoda|Próbki|Zacznij',`
Ile kart tworzy oceniany układ w Hold’em?
A♣ 2♦ 3♥ 4♠ 5♣: jaka jest najwyższa ranga tego strita? As = 14.
Stół K♣ K♦ 7♥ 4♠ 2♣; miejsce 1 A♥ Q♥, miejsce 2 A♠ J♠. Które miejsce wygrywa?
Stół A♠ K♠ Q♠ J♠ T♠, trzech graczy. Jaki procent puli przypada każdemu przed rozdzieleniem niepodzielnych żetonów?
W twoich kartach i flopie widać cztery kiery, innych kart nie znasz. Ile kierów docelowych pozostało?
47 nieznanych kart, 9 stałych celów: procentowa szansa trafienia następną kartą?
47 nieznanych kart, 9 stałych celów, dwie karty bez dalszych decyzji: procentowa szansa co najmniej jednego trafienia?
Na turnie 46 nieznanych kart i 9 dostępnych celów. Procentowa szansa trafienia na riverze?
Jaki przybliżony procent daje reguła czterech przy 9 outach na flopie i dwóch przyszłych kartach?
Ile nieuporządkowanych par kart można wybrać z 52 różnych kart?
Ile konkretnych kombinacji QQ istnieje bez blokerów?
Ile kombinacji AKs bez blokerów? s oznacza ten sam kolor.
Ile kombinacji AKo bez blokerów? o oznacza różne kolory.
Masz A♠ 7♦, nie znasz innych asów. Ile kombinacji AA pozostaje?
Znane są dwie pełne ręce i trzy karty flopa, bez innych martwych kart. Ile nieuporządkowanych par turn/river?
Pula 60, zakład rywala 20: P = 80, dodatkowe sprawdzenie C = 20. Jedna pula, bez dalszych zakładów: procent equity na progu opłacalności?
P = 80, C = 20, E = 25%, jedna dostępna pula, bez rake i dalszych zakładów. EV sprawdzenia względem spasowania teraz?
P = 80, C = 20, E = 15%, bez dalszych zakładów. EV sprawdzenia?
Czysty blef: P0 = 100, B = 50, equity zero po sprawdzeniu, bez dalszych decyzji. Jaki procent pasów daje próg opłacalności?
P0 = 100, B = 50, zakładany pas F = 40%, equity zero po sprawdzeniu. EV blefu?
100 jednakowo prawdopodobnych wyników: 30 samodzielnych wygranych, 20 remisów dwóch graczy, 50 przegranych. Equity w procentach?
Przed blindami gracze mają 240 i 90 żetonów. Jaki jest efektywny stos?
Dwóch graczy: miejsce 1 button/mała ciemna, miejsce 2 duża ciemna. Obaj mogą działać. Kto pierwszy przed flopem?
Model: P = 80, C = 20, trafienie 10%. Po trafieniu zawsze wygrywasz i dostajesz dodatkowe 100 od rywala; po chybieniu przegrywasz bez dopłat. EV sprawdzenia?
Bazowe EV +5 żetonów. Oddzielnie jest 10% szansy dodatkowej straty 80, dotąd nieuwzględnionej. Nowe EV?
Trzej gracze wpłacają 30, 80 i 80 żetonów. Pierwszy jest all-in. Ile jest w puli głównej dostępnej wszystkim trzem?
Bez blokerów zakres zawiera tylko AA z wagą 100% i KK z 50%. Jaki jest znormalizowany procent AA?
9 celów do koloru, 8 do strita, dokładnie 2 wspólne karty. Ile różnych celów?
`, `
Liczy się najlepszych pięć z siedmiu. Można użyć zero, jedną lub dwie własne karty; nie ocenia się siedmiu naraz.
As jest tutaj poniżej dwójki. Strit nie może zawijać przez asa.
Po K-K-A decyduje kicker Q przeciw J. Wspólny as nie oznacza remisu.
Wszyscy używają tego samego pokera królewskiego. Kolor i własne karty nie rozstrzygają remisu; niepodzielne żetony przydziela reguła stołu.
Karty docelowe nie gwarantują wygranej. Rywal też może się poprawić; sparowany stół lub wyższy kolor mogą mieć znaczenie.
Mianownik to obecna liczba nieznanych kart. Trafienie celu nie oznacza automatycznie wygranej.
Odejmij od jedności prawdopodobieństwo dwóch chybień. Podwojenie szansy jednej karty pomija jej usunięcie i liczy wyniki podwójnie.
To jawnie oznaczone przybliżenie, inne niż wartość dokładna. Zakłada stałe cele i rzeczywiste zobaczenie dwóch kart.
Odwrócenie kolejności tych samych kart nie tworzy nowej kombinacji. 169 pól to klasy, nie konkretne ręce.
Licz kombinacje przed blokerami. s obejmuje jeden kolor, o różne kolory; bez sufiksu oba warianty.
Usuń tylko znane karty i znormalizuj wagi. Tajne karty symulatora nie są znanymi blokerami.
Pary bez kolejności wystarczą do końcowego equity; decyzje na ulicach wymagają kolejności.
Jedna pula, bez rake i dalszych zakładów. Sprawdzenie wchodzi do końcowej puli; nie odejmuj ponownie dawnych wpłat. Późniejsze szczęście nie zmienia obliczenia.
Częstość pasowania jest założeniem, nie dowiedzioną cechą rywala. Czysty blef jest dodatni dopiero powyżej progu.
Remis dwóch graczy liczy się jako pół puli. Częstości wygranych, remisów i przegranych różnią się od equity.
Przeciw jednemu rywalowi można grać tylko o mniejszy dostępny stos.
Button/mała ciemna działa pierwszy przed flopem, ostatni po flopie. Sama pozycja nie daje rozwiązanej strategii.
Dodatkowa wpłata wymaga trafienia i wygranej. Prawdziwy rywal może nie zapłacić; trzeba uwzględnić własne przyszłe koszty i brudne outy.
Odejmij oczekiwaną dodatkową stratę tylko raz. Surowe equity nie przewiduje tej założonej przyszłej wpłaty.
Każdą pulę mogą wygrać tylko uprawnieni gracze. Pula główna i boczna wymagają osobnych equity.
Wagi dotyczą każdej kombinacji i dzieli się je przez sumę. Waga pola nie jest jeszcze końcowym prawdopodobieństwem.
Odejmij część wspólną raz, aby uniknąć podwójnego liczenia. Różne cele nie muszą być czystymi zwycięskimi outami.
`);
catalog('cs','Hrát|Laboratoř pravděpodobnosti|Cvičení|Rozbor her|Pokrok|Nastavení|Začít hru|Další hra|Zahodit|Check|Dorovnat|Vsadit|Navýšit|All-in|Pot|Stack|Společné karty|Vy|Pauza|Pokračovat|Jeden krok|Ukázat výpočet|Skrýt odpověď|Praxe|Učit se|Nejprve odpovědět|Zkontrolovat odpověď|Další cvičení|Přehrát|Zálohovat pokrok|Importovat zálohu|Vynulovat pokrok|Zrušit|Potvrdit|Začátečnický pohled|Pokročilý pohled|Jazyk|Omezit pohyb|Správný výpočet|Přečíst vysvětlení|Vaše odpověď|Postup výpočtu|Přesnost výpočtů|Pokusy|Herní žetony|Počítání…|Zastavit výpočet|Rozsah soupeře|Váha|Známé karty|Očekávaný podíl potu|Předpoklady|Metoda|Vzorky|Začít',`
Kolik karet tvoří hodnocenou kombinaci v Hold’emu?
A♣ 2♦ 3♥ 4♠ 5♣: jaká je nejvyšší hodnota této postupky? Eso = 14.
Stůl K♣ K♦ 7♥ 4♠ 2♣; místo 1 A♥ Q♥, místo 2 A♠ J♠. Které místo vyhraje?
Stůl A♠ K♠ Q♠ J♠ T♠, tři hráči. Kolik procent potu patří každému před nedělitelnými žetony?
Ve vašich kartách a flopu jsou čtyři srdce, jiné karty neznáte. Kolik cílových srdcí zbývá?
47 neznámých karet, 9 pevných cílů: pravděpodobnost zásahu další kartou v procentech?
47 neznámých karet, 9 pevných cílů, dvě karty bez dalších rozhodnutí: procentní šance alespoň jednoho zásahu?
Na turnu je 46 neznámých karet a 9 cílů. Procentní šance zásahu na riveru?
Jaké přibližné procento dává pravidlo čtyř při 9 outech na flopu a dvou budoucích kartách?
Kolik neuspořádaných dvojic lze vybrat z 52 různých karet?
Kolik konkrétních kombinací QQ je bez blockerů?
Kolik kombinací AKs bez blockerů? s znamená stejnou barvu.
Kolik kombinací AKo bez blockerů? o znamená různé barvy.
Máte A♠ 7♦, další esa neznáte. Kolik kombinací AA zbývá?
Dvě úplné ruce a tři flopové karty jsou známé, žádné jiné mrtvé karty. Kolik neuspořádaných dvojic turn/river?
Pot 60, soupeř sází 20: P = 80, další dorovnání C = 20. Jeden pot, bez dalších sázek: procentní equity na bodu zvratu?
P = 80, C = 20, E = 25%, jeden způsobilý pot, bez rake a dalších sázek. EV dorovnání proti okamžitému zahození?
P = 80, C = 20, E = 15%, bez dalších sázek. EV dorovnání?
Čistý bluf: P0 = 100, B = 50, nulová equity při dorovnání, bez dalších rozhodnutí. Procento zahození na bodu zvratu?
P0 = 100, B = 50, předpokládané zahození F = 40%, nulová equity při dorovnání. EV blufu?
100 stejně pravděpodobných výsledků: 30 samostatných výher, 20 remíz dvou hráčů, 50 proher. Equity v procentech?
Před blindy mají dva hráči 240 a 90 žetonů. Efektivní stack?
Dva hráči: místo 1 button/small blind, místo 2 big blind. Oba mohou jednat. Kdo jedná první před flopem?
Model: P = 80, C = 20, zásah 10%. Při zásahu vždy výhra a dalších 100 od soupeře; jinak prohra bez dalších plateb. EV dorovnání?
Základní EV +5 žetonů. Samostatně je 10% riziko dosud nezapočtené další ztráty 80. Nové EV?
Tři hráči vloží 30, 80 a 80 žetonů. První je all-in. Kolik je v hlavním potu dostupném všem třem?
Bez blockerů obsahuje rozsah pouze AA s vahou 100% a KK s 50%. Normalizované procento AA?
9 cílů pro barvu a 8 pro postupku; přesně 2 karty patří do obou skupin. Kolik různých cílů?
`, `
Počítá se nejlepších pět ze sedmi. Lze použít nula, jednu nebo dvě vlastní karty; sedm se nehodnotí dohromady.
Eso je zde pod dvojkou. Postupka nemůže obíhat přes eso.
Po K-K-A rozhoduje kicker Q proti J. Společné eso neznamená remízu.
Všichni hrají stejnou královskou postupku v barvě. Barva ani vlastní karty nerozhodují remízu; liché žetony určuje pravidlo stolu.
Cílové karty nezaručují výhru. Soupeř se může zlepšit; spárovaný stůl nebo vyšší barva mohou hrát roli.
Jmenovatel používá právě neznámé karty. Zásah cíle není automaticky výhra.
Odečtěte dvě minutí od jedné. Zdvojení šance jedné karty ignoruje odebírání a některé výsledky počítá dvakrát.
Jde o označený odhad, ne přesný výsledek. Předpokládá pevné cíle a skutečné vidění dvou karet.
Obrácené pořadí stejných karet není nová kombinace. 169 buněk jsou třídy, ne konkrétní ruce.
Počítejte kombinace před blockery. s zahrnuje stejnou barvu, o různé; bez přípony jsou obě možnosti.
Odeberte jen známé karty a normalizujte váhy. Tajné karty simulátoru nejsou známé blockery.
Neuspořádané dvojice stačí pro konečnou equity; rozhodnutí na jednotlivých kolech vyžadují pořadí.
Jeden pot, bez rake a dalších sázek. Dorovnání patří do konečného potu; starší vklady neodečítejte znovu. Pozdější štěstí výpočet nemění.
Četnost zahození je předpoklad, ne prokázaná vlastnost soupeře. Čistý bluf je kladný až nad hranicí.
Remíza dvou hráčů znamená půl potu. Četnosti výhry, remízy a prohry se liší od equity.
Proti soupeři se soutěží pouze o menší dostupný stack.
Button/small blind jedná první před flopem a poslední po něm. Pozice sama není vyřešená strategie.
Další platba vyžaduje zásah a výhru. Skutečný soupeř nemusí zaplatit; budoucí vlastní náklady a nečisté outy se také počítají.
Očekávanou dodatečnou ztrátu odečtěte jen jednou. Samotná equity nepředpovídá tuto předpokládanou budoucí platbu.
Každý pot mohou vyhrát jen způsobilí hráči. Hlavní a vedlejší pot vyžadují samostatnou equity.
Váhy platí pro každou kombinaci a dělí se jejich součtem. Váha buňky není výsledná pravděpodobnost.
Průnik odečtěte jednou, aby se karty nepočítaly dvakrát. Různé cíle nemusí být čisté vítězné outy.
`);
catalog('sk','Hrať|Laboratórium šancí|Cvičenia|Rozbor hier|Pokrok|Nastavenia|Začať hru|Ďalšia hra|Zahodiť|Check|Dorovnať|Staviť|Navýšiť|All-in|Pot|Stack|Spoločné karty|Vy|Pauza|Pokračovať|Jeden krok|Ukázať výpočet|Skryť odpoveď|Prax|Učiť sa|Najprv odpovedať|Skontrolovať odpoveď|Ďalšie cvičenie|Prehrať|Zálohovať pokrok|Importovať zálohu|Vynulovať pokrok|Zrušiť|Potvrdiť|Začiatočnícky pohľad|Pokročilý pohľad|Jazyk|Obmedziť pohyb|Správny výpočet|Prečítať vysvetlenie|Vaša odpoveď|Postup výpočtu|Presnosť výpočtov|Pokusy|Herné žetóny|Počítanie…|Zastaviť výpočet|Rozsah súpera|Váha|Známe karty|Očakávaný podiel potu|Predpoklady|Metóda|Vzorky|Začať',`
Koľko kariet tvorí hodnotenú kombináciu v Hold’eme?
A♣ 2♦ 3♥ 4♠ 5♣: aká je najvyššia hodnota tejto postupky? Eso = 14.
Stôl K♣ K♦ 7♥ 4♠ 2♣; miesto 1 A♥ Q♥, miesto 2 A♠ J♠. Ktoré miesto vyhrá?
Stôl A♠ K♠ Q♠ J♠ T♠, traja hráči. Koľko percent potu patrí každému pred nedeliteľnými žetónmi?
Vo vašich kartách a flope vidno štyri srdcia, iné karty nepoznáte. Koľko cieľových sŕdc zostáva?
47 neznámych kariet, 9 pevných cieľov: percentuálna šanca zásahu ďalšou kartou?
47 neznámych kariet, 9 pevných cieľov, dve karty bez ďalších rozhodnutí: percentuálna šanca aspoň jedného zásahu?
Na turne je 46 neznámych kariet a 9 cieľov. Percentuálna šanca zásahu na riveri?
Aké približné percento dá pravidlo štyroch pri 9 outoch na flope a dvoch budúcich kartách?
Koľko neusporiadaných dvojíc možno vybrať z 52 rôznych kariet?
Koľko konkrétnych kombinácií QQ je bez blockerov?
Koľko kombinácií AKs bez blockerov? s znamená rovnakú farbu.
Koľko kombinácií AKo bez blockerov? o znamená rôzne farby.
Máte A♠ 7♦, ďalšie esá nepoznáte. Koľko kombinácií AA zostáva?
Dve úplné ruky a tri flopové karty sú známe, žiadne ďalšie mŕtve karty. Koľko neusporiadaných dvojíc turn/river?
Pot 60, súper staví 20: P = 80, dodatočné dorovnanie C = 20. Jeden pot, bez ďalších stávok: percentuálna equity na bode zvratu?
P = 80, C = 20, E = 25%, jeden oprávnený pot, bez rake a ďalších stávok. EV dorovnania oproti zahodeniu teraz?
P = 80, C = 20, E = 15%, bez ďalších stávok. EV dorovnania?
Čistý bluf: P0 = 100, B = 50, nulová equity pri dorovnaní, bez ďalších rozhodnutí. Percento zahodení na bode zvratu?
P0 = 100, B = 50, predpokladané zahodenie F = 40%, nulová equity pri dorovnaní. EV blufu?
100 rovnako pravdepodobných výsledkov: 30 samostatných výhier, 20 remíz dvoch hráčov, 50 prehier. Equity v percentách?
Pred blindmi majú dvaja hráči 240 a 90 žetónov. Efektívny stack?
Dvaja hráči: miesto 1 button/small blind, miesto 2 big blind. Obaja môžu konať. Kto prvý pred flopom?
Model: P = 80, C = 20, zásah 10%. Pri zásahu vždy výhra a ďalších 100 od súpera; inak prehra bez ďalších platieb. EV dorovnania?
Základné EV +5 žetónov. Samostatne je 10% riziko ďalšej straty 80, dosiaľ nezapočítanej. Nové EV?
Traja hráči vložia 30, 80 a 80 žetónov. Prvý je all-in. Koľko je v hlavnom pote dostupnom všetkým trom?
Bez blockerov obsahuje rozsah len AA s váhou 100% a KK s 50%. Normalizované percento AA?
9 cieľov pre farbu a 8 pre postupku; presne 2 karty patria do oboch skupín. Koľko rôznych cieľov?
`, `
Počíta sa najlepších päť zo siedmich. Možno použiť nula, jednu alebo dve vlastné karty; sedem sa nehodnotí naraz.
Eso je tu pod dvojkou. Postupka nemôže obiehať cez eso.
Po K-K-A rozhoduje kicker Q proti J. Spoločné eso neznamená remízu.
Všetci hrajú rovnakú kráľovskú postupku vo farbe. Farba ani vlastné karty nerozhodujú remízu; nepárne žetóny určuje pravidlo stola.
Cieľové karty nezaručujú výhru. Súper sa môže zlepšiť; spárovaný stôl alebo vyššia farba môžu zavážiť.
Menovateľ používa aktuálne neznáme karty. Zásah cieľa nie je automatická výhra.
Odpočítajte dve minutia od jednej. Zdvojenie šance jednej karty ignoruje odoberanie a niektoré výsledky počíta dvakrát.
Ide o označený odhad, nie presný výsledok. Predpokladá pevné ciele a skutočné videnie dvoch kariet.
Obrátené poradie tých istých kariet nie je nová kombinácia. 169 buniek sú triedy, nie konkrétne ruky.
Počítajte kombinácie pred blockermi. s zahŕňa rovnakú farbu, o rôzne; bez prípony obe možnosti.
Odstráňte len známe karty a normalizujte váhy. Tajné karty simulátora nie sú známe blockery.
Neusporiadané dvojice stačia na konečnú equity; rozhodnutia na jednotlivých kolách vyžadujú poradie.
Jeden pot, bez rake a ďalších stávok. Dorovnanie patrí do konečného potu; staršie vklady neodpočítavajte znova. Neskoršie šťastie výpočet nemení.
Frekvencia zahodenia je predpoklad, nie dokázaná vlastnosť súpera. Čistý bluf je kladný až nad hranicou.
Remíza dvoch hráčov znamená polovicu potu. Frekvencie výhry, remízy a prehry sa líšia od equity.
Proti súperovi sa súťaží len o menší dostupný stack.
Button/small blind koná prvý pred flopom a posledný po ňom. Pozícia sama nie je vyriešená stratégia.
Ďalšia platba vyžaduje zásah a výhru. Skutočný súper nemusí zaplatiť; budúce vlastné náklady a nečisté outy sa tiež počítajú.
Očakávanú dodatočnú stratu odpočítajte iba raz. Samotná equity nepredpovedá túto predpokladanú budúcu platbu.
Každý pot môžu vyhrať len oprávnení hráči. Hlavný a vedľajší pot vyžadujú samostatnú equity.
Váhy platia pre každú kombináciu a delia sa ich súčtom. Váha bunky nie je výsledná pravdepodobnosť.
Prienik odpočítajte raz, aby sa karty nepočítali dvakrát. Rôzne ciele nemusia byť čisté víťazné outy.
`);
