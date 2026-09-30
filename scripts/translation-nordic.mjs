import {catalog} from './translation-build.mjs';
catalog('sv','Spela|Sannolikhetslabbet|Övningar|Granska händer|Framsteg|Inställningar|Starta hand|Nästa hand|Lägg dig|Checka|Syna|Satsa|Höj|All-in|Pott|Markerstapel|Gemensamma kort|Du|Paus|Fortsätt|Ett steg|Visa beräkning|Dölj svar|Träna|Lär dig|Gissa först|Kontrollera svar|Nästa övning|Spela om|Säkerhetskopiera framsteg|Importera kopia|Återställ framsteg|Avbryt|Bekräfta|Nybörjarvy|Avancerad vy|Språk|Minskad rörelse|Rätt beräkning|Läs förklaringen|Ditt svar|Beräkning steg för steg|Beräkningsnoggrannhet|Försök|Spelmarker|Beräknar…|Stoppa beräkning|Motståndarens range|Vikt|Kända kort|Förväntad pottandel|Antaganden|Metod|Stickprov|Börja',`
Hur många kort bildar den bedömda Hold’em-handen?
A♣ 2♦ 3♥ 4♠ 5♣: vilken är stegens högsta valör? Ess = 14.
Bord K♣ K♦ 7♥ 4♠ 2♣; plats 1 A♥ Q♥, plats 2 A♠ J♠. Vilken plats vinner?
Bord A♠ K♠ Q♠ J♠ T♠, tre spelare. Vilken procent av potten får var och en före odelbara marker?
Fyra hjärter syns bland dina kort och floppen, inga andra kända kort. Hur många hjärter som målkort återstår?
47 okända kort, 9 fasta målkort: träffchans på nästa kort i procent?
47 okända kort, 9 fasta mål, två kort utan fler beslut: chans till minst en träff i procent?
På turn är 46 kort okända och 9 mål tillgängliga. Träffchans på river i procent?
Vilken ungefärlig procent ger fyrregeln med 9 outs på floppen och två kommande kort?
Hur många oordnade tvåkortskombinationer finns bland 52 olika kort?
Hur många konkreta QQ-kombinationer finns utan blockerare?
Hur många AKs-kombinationer utan blockerare? s betyder samma färg.
Hur många AKo-kombinationer utan blockerare? o betyder olika färger.
Du har A♠ 7♦, inga andra kända ess. Hur många AA-kombinationer återstår?
Två hela händer och tre floppkort är kända, inga fler döda kort. Hur många oordnade turn/river-par?
Pott 60, motståndaren satsar 20: P = 80, extra syn C = 20. En pott, inga framtida satsningar: nödvändig equity i procent?
P = 80, C = 20, E = 25%, en berättigad pott, ingen rake eller framtida satsning. Synens EV jämfört med att lägga sig nu?
P = 80, C = 20, E = 15%, inga framtida satsningar. Synens EV?
Ren bluff: P0 = 100, B = 50, noll equity vid syn, inga framtida beslut. Vilken läggningsprocent ger noll EV?
P0 = 100, B = 50, antagen läggningschans F = 40%, noll equity vid syn. Bluffens EV?
100 lika sannolika utfall: 30 ensamma vinster, 20 delningar mellan två, 50 förluster. Equity i procent?
Före mörkarna har två spelare 240 och 90 marker. Effektiv stack?
Två spelare: plats 1 knapp/lilla mörken, plats 2 stora mörken. Båda kan agera. Vem börjar före floppen?
Modell: P = 80, C = 20, träffchans 10%. Träff ger alltid vinst och 100 extra från motståndaren; miss ger förlust utan mer betalning. Synens EV?
Grund-EV +5 marker. Separat finns 10% risk att förlora ytterligare 80, ännu inte medräknat. Nytt EV?
Tre spelare satsar 30, 80 och 80 marker. Den första är all-in. Hur stor är huvudpotten som alla tre får vinna?
Utan blockerare innehåller en range bara AA med vikt 100% och KK med 50%. Normaliserad AA-andel i procent?
9 färgmål och 8 stegmål; exakt 2 kort ingår i båda grupperna. Hur många olika mål?
`, `
De bästa fem av sju räknas. Noll, ett eller två egna kort får användas; sju kort bedöms inte tillsammans.
Esset är lågt här, under tvåan. En stege får inte fortsätta runt esset.
Efter K-K-A avgör kickern Q mot J. Det gemensamma esset ger inte lika händer.
Alla spelar samma royal flush. Färg och egna kort bryter inte lika; odelbara marker följer bordsregeln.
Målkort garanterar inte vinst. Motståndaren kan förbättras; parade bord och högre färg kan spela roll.
Nämnaren använder nu okända kort. Att träffa målet är inte automatiskt att vinna.
Dra två missar från ett. Att dubbla samma enkelchans ignorerar kortborttagning och dubbelräknar utfall.
Detta är uttryckligen en approximation. Exakt sannolikhet skiljer sig; fasta mål och två faktiskt sedda kort krävs.
Samma två kort i omvänd ordning är ingen ny kombination. Rutnätets 169 celler är klasser, inte konkreta händer.
Räkna kombinationer före blockerare. s tar samma färg, o olika; utan suffix ingår båda.
Ta bara bort kända kort och normalisera sedan vikterna. Simulatorns hemliga kort är inte kända blockerare.
Oordnade par räcker för slutlig showdown-equity; beslut på olika gator kräver ordningen.
En pott, ingen rake eller fler satsningar. Synen ingår i slutpotten; dra inte av tidigare bidrag igen. Senare tur ändrar inte beräkningen.
Läggningsfrekvensen är ett antagande, ingen bevisad egenskap. Bara över gränsen får den rena bluffen positivt EV.
Delning mellan två räknas som en halv pott. Vinst-, delnings- och förlustfrekvens skiljer sig från equity.
Bara den mindre tillgängliga stacken kan spelas om mot en motståndare.
Knappen/lilla mörken agerar först före floppen och sist efter den. Position ger inte ensam en löst strategi.
Extra betalning kräver träff och vinst. Verkliga motståndare kanske inte betalar; egna framtida kostnader och orena outs måste räknas.
Dra av den förväntade extraförlusten en gång. Rå equity förutsäger inte denna antagna framtida betalning.
Bara berättigade spelare får vinna varje pott. Huvud- och sidopott behöver separata equityvärden.
Vikter gäller per kombination och delas med totalsumman. En cellvikt är inte slutlig sannolikhet.
Dra överlappningen en gång för att undvika dubbelräkning. Olika mål är inte nödvändigtvis rena vinst-outs.
`);
catalog('da','Spil|Sandsynlighedslab|Øvelser|Gennemgå hænder|Fremskridt|Indstillinger|Start hånd|Næste hånd|Fold|Check|Call|Bet|Raise|All-in|Pulje|Stak|Fælleskort|Dig|Pause|Fortsæt|Ét trin|Vis beregning|Skjul svar|Træning|Lær|Gæt først|Kontrollér svar|Næste øvelse|Gentag|Sikkerhedskopiér fremskridt|Importér kopi|Nulstil fremskridt|Annullér|Bekræft|Begyndervisning|Avanceret visning|Sprog|Mindre bevægelse|Korrekt beregning|Læs forklaringen|Dit svar|Udregning|Beregningsnøjagtighed|Forsøg|Spillejetoner|Beregner…|Stop beregning|Modstanderens range|Vægt|Kendte kort|Forventet puljeandel|Antagelser|Metode|Stikprøver|Begynd',`
Hvor mange kort danner den vurderede Hold’em-hånd?
A♣ 2♦ 3♥ 4♠ 5♣: hvad er straightens højeste værdi? Es = 14.
Bord K♣ K♦ 7♥ 4♠ 2♣; plads 1 A♥ Q♥, plads 2 A♠ J♠. Hvilken plads vinder?
Bord A♠ K♠ Q♠ J♠ T♠, tre spillere. Hvilken procent af puljen tilkommer hver før udelelige jetoner?
Fire hjerter ses blandt dine kort og floppet, ingen andre kendte kort. Hvor mange hjerter-målkort er tilbage?
47 ukendte kort, 9 faste mål: træfsandsynlighed på næste kort i procent?
47 ukendte kort, 9 faste mål, to kort uden flere beslutninger: procentchance for mindst ét træf?
På turn er 46 kort ukendte og 9 mål tilgængelige. Træfprocent på river?
Hvilken omtrentlig procent giver firereglen ved 9 flop-outs og to kommende kort?
Hvor mange uordnede to-kort-kombinationer fra 52 forskellige kort?
Hvor mange konkrete QQ-kombinationer uden blockere?
Hvor mange AKs-kombinationer uden blockere? s betyder samme kulør.
Hvor mange AKo-kombinationer uden blockere? o betyder forskellige kulører.
Du har A♠ 7♦, ingen andre kendte esser. Hvor mange AA-kombinationer er tilbage?
To hele hænder og tre flopkort kendt, ingen øvrige døde kort. Hvor mange uordnede turn/river-par?
Pulje 60, modstanderens indsats 20: P = 80, ekstra call C = 20. Én pulje, ingen fremtidige indsatser: equity i procent ved nulpunktet?
P = 80, C = 20, E = 25%, én berettiget pulje, ingen rake eller flere indsatser. Call-EV sammenlignet med at folde nu?
P = 80, C = 20, E = 15%, ingen fremtidige indsatser. Call-EV?
Rent bluff: P0 = 100, B = 50, nul equity ved call, ingen senere beslutninger. Foldprocent ved nulpunktet?
P0 = 100, B = 50, antaget foldchance F = 40%, nul equity ved call. Bluff-EV?
100 lige sandsynlige udfald: 30 enegevinster, 20 delinger mellem to, 50 tab. Equity i procent?
Før blinds har to spillere 240 og 90 jetoner. Effektiv stak?
To spillere: plads 1 knap/small blind, plads 2 big blind. Begge kan handle. Hvem handler først preflop?
Model: P = 80, C = 20, træfchance 10%. Træf giver altid sejr og 100 ekstra fra modstanderen; miss giver tab uden mere betaling. Call-EV?
Grund-EV +5 jetoner. Separat er der 10% risiko for yderligere tab på 80, endnu ikke medregnet. Nyt EV?
Tre spillere lægger 30, 80 og 80 jetoner. Den første er all-in. Hvor stor er hovedpuljen, alle tre kan vinde?
Uden blockere indeholder en range kun AA med vægt 100% og KK med 50%. Normaliseret AA-procent?
9 flush-mål og 8 straight-mål; præcis 2 kort tilhører begge grupper. Hvor mange forskellige mål?
`, `
De bedste fem af syv tæller. Nul, ét eller to egne kort må bruges; syv vurderes ikke samlet.
Esset er lavt her, under toeren. En straight kan ikke fortsætte rundt om esset.
Efter K-K-A afgør kickeren Q mod J. Det fælles es giver ikke automatisk lighed.
Alle spiller samme royal flush. Kulør og egne kort afgør ikke lighed; udelelige jetoner følger bordreglen.
Målkort garanterer ikke sejr. Modstanderen kan også forbedre sig; parret bord eller højere flush kan tælle.
Nævneren bruger de aktuelt ukendte kort. At ramme målet er ikke automatisk at vinde.
Træk to missere fra én. At fordoble samme enkeltchance ignorerer kortfjernelse og dobbeltæller udfald.
Dette er udtrykkeligt en tilnærmelse. Den eksakte chance er anderledes og kræver faste mål samt to sete kort.
Omvendt rækkefølge af samme kort er ikke en ny kombination. De 169 felter er klasser, ikke konkrete hænder.
Tæl kombinationer før blockere. s inkluderer samme kulør, o forskellige; uden endelse indgår begge.
Fjern kun kendte kort og normalisér vægtene. Simulatorens hemmelige kort er ikke kendte blockere.
Uordnede par er nok til afsluttende equity; beslutninger på hver gade kræver rækkefølgen.
Én pulje, ingen rake eller flere indsatser. Callet indgår i slutpuljen; træk ikke tidligere bidrag fra igen. Senere held ændrer ikke regnestykket.
Foldfrekvensen er en antagelse, ikke en bevist egenskab. Kun over grænsen bliver det rene bluff positivt.
En deling mellem to tæller som en halv pulje. Sejrs-, delings- og tabsfrekvenser er ikke equity.
Kun den mindre tilgængelige stak kan konkurreres om mod én modstander.
Knappen/small blind handler først preflop og sidst efter floppet. Position giver ikke alene en løst strategi.
Ekstra betaling kræver træf og sejr. Virkelige modstandere betaler måske ikke; egne senere omkostninger og urene outs tæller også.
Træk det forventede ekstratab fra én gang. Rå equity forudsiger ikke denne antagne fremtidige betaling.
Kun berettigede spillere kan vinde hver pulje. Hoved- og sidepuljer kræver særskilt equity.
Vægte gælder pr. kombination og deles med den samlede sum. En cellevægt er ikke den endelige sandsynlighed.
Træk overlap fra én gang for at undgå dobbeltælling. Forskellige mål er ikke nødvendigvis rene vinder-outs.
`);
catalog('nb','Spill|Sannsynlighetslab|Øvelser|Gjennomgå hender|Fremgang|Innstillinger|Start hånd|Neste hånd|Kast|Sjekk|Syn|Sats|Høyne|All-in|Pott|Stabel|Felleskort|Du|Pause|Fortsett|Ett steg|Vis beregning|Skjul svar|Trening|Lær|Gjett først|Kontroller svar|Neste øvelse|Gjenta|Sikkerhetskopier fremgang|Importer kopi|Nullstill fremgang|Avbryt|Bekreft|Nybegynnervisning|Avansert visning|Språk|Redusert bevegelse|Riktig beregning|Les forklaringen|Ditt svar|Utregning|Beregningsnøyaktighet|Forsøk|Spillesjetonger|Beregner…|Stopp beregning|Motstanderens range|Vekt|Kjente kort|Forventet pottandel|Antakelser|Metode|Utvalg|Begynn',`
Hvor mange kort danner den vurderte Hold’em-hånden?
A♣ 2♦ 3♥ 4♠ 5♣: hva er straightens høyeste verdi? Ess = 14.
Bord K♣ K♦ 7♥ 4♠ 2♣; sete 1 A♥ Q♥, sete 2 A♠ J♠. Hvilket sete vinner?
Bord A♠ K♠ Q♠ J♠ T♠, tre spillere. Hvilken prosent av potten får hver før udelelige sjetonger?
Fire hjerter vises blant dine kort og floppen, ingen andre kjente kort. Hvor mange hjerter som målkort gjenstår?
47 ukjente kort, 9 faste mål: treffprosent på neste kort?
47 ukjente kort, 9 faste mål, to kort uten flere avgjørelser: prosentvis sjanse for minst ett treff?
På turn er 46 kort ukjente og 9 mål tilgjengelige. Treffprosent på river?
Hvilken omtrentlig prosent gir firerregelen ved 9 flop-outs og to kommende kort?
Hvor mange uordnede tokortskombinasjoner finnes blant 52 ulike kort?
Hvor mange konkrete QQ-kombinasjoner uten blokkere?
Hvor mange AKs-kombinasjoner uten blokkere? s betyr samme farge.
Hvor mange AKo-kombinasjoner uten blokkere? o betyr ulike farger.
Du har A♠ 7♦, ingen andre kjente ess. Hvor mange AA-kombinasjoner gjenstår?
To hele hender og tre flopkort er kjent, ingen andre døde kort. Hvor mange uordnede turn/river-par?
Pott 60, motstanderens innsats 20: P = 80, ekstra syn C = 20. Én pott, ingen fremtidige innsatser: nødvendig equity i prosent ved nullpunktet?
P = 80, C = 20, E = 25%, én berettiget pott, ingen rake eller flere innsatser. Syn-EV sammenlignet med å kaste nå?
P = 80, C = 20, E = 15%, ingen fremtidige innsatser. Syn-EV?
Ren bløff: P0 = 100, B = 50, null equity ved syn, ingen senere valg. Kasteprosent ved nullpunktet?
P0 = 100, B = 50, antatt kastesjanse F = 40%, null equity ved syn. Bløff-EV?
100 like sannsynlige utfall: 30 egne seire, 20 delinger mellom to, 50 tap. Equity i prosent?
Før blindene har to spillere 240 og 90 sjetonger. Effektiv stabel?
To spillere: sete 1 knapp/lilleblind, sete 2 storeblind. Begge kan handle. Hvem begynner preflop?
Modell: P = 80, C = 20, treffsjansen 10%. Treff gir alltid seier og 100 ekstra fra motstanderen; bom gir tap uten mer betaling. Syn-EV?
Grunn-EV +5 sjetonger. Separat er det 10% risiko for ytterligere tap på 80, ennå ikke medregnet. Ny EV?
Tre spillere legger inn 30, 80 og 80 sjetonger. Den første er all-in. Hvor stor er hovedpotten som alle tre kan vinne?
Uten blokkere inneholder en range bare AA med vekt 100% og KK med 50%. Normalisert AA-prosent?
9 flushmål og 8 straightmål; nøyaktig 2 kort tilhører begge grupper. Hvor mange ulike mål?
`, `
De beste fem av sju teller. Null, ett eller to egne kort kan brukes; sju vurderes ikke sammen.
Esset er lavt her, under toeren. En straight kan ikke fortsette rundt esset.
Etter K-K-A avgjør kickeren Q mot J. Det delte esset gir ikke automatisk lik hånd.
Alle spiller samme royal flush. Farge og egne kort bryter ikke likhet; udelelige sjetonger følger bordregelen.
Målkort garanterer ikke seier. Motstanderen kan også forbedre seg; paret bord eller høyere flush kan telle.
Nevneren bruker kortene som nå er ukjente. Å treffe målet betyr ikke automatisk seier.
Trekk to bom fra én. Dobling av samme enkeltsjanse ignorerer kortfjerning og dobbeltteller utfall.
Dette er uttrykkelig en tilnærming. Eksakt sannsynlighet er annerledes og krever faste mål og to faktisk sette kort.
Omvendt rekkefølge av samme kort er ingen ny kombinasjon. De 169 feltene er klasser, ikke konkrete hender.
Tell kombinasjoner før blokkere. s inkluderer samme farge, o ulike; uten endelse er begge med.
Fjern bare kjente kort og normaliser vektene. Simulatorens hemmelige kort er ikke kjente blokkere.
Uordnede par er nok for slutt-equity; beslutninger per gate krever rekkefølgen.
Én pott, ingen rake eller flere innsatser. Synen inngår i sluttpotten; trekk ikke tidligere bidrag fra igjen. Senere flaks endrer ikke beregningen.
Kastefrekvensen er en antakelse, ikke en bevist egenskap. Bare over grensen får den rene bløffen positiv EV.
Deling mellom to teller som en halv pott. Vinn-, delings- og tapsfrekvenser er forskjellige fra equity.
Bare den mindre tilgjengelige stabelen kan spilles om mot én motstander.
Knappen/lilleblind handler først preflop og sist etter floppen. Posisjon gir ikke alene en løst strategi.
Ekstrabetaling krever treff og seier. Virkelige motstandere betaler kanskje ikke; egne fremtidige kostnader og urene outs må medregnes.
Trekk det forventede ekstratapet fra én gang. Rå equity forutsier ikke denne antatte fremtidige betalingen.
Bare berettigede spillere kan vinne hver pott. Hoved- og sidepotter trenger egen equity.
Vekter gjelder per kombinasjon og deles på totalsummen. En cellevekt er ikke den endelige sannsynligheten.
Trekk overlapp fra én gang for å unngå dobbelttelling. Ulike mål er ikke nødvendigvis rene vinner-outs.
`);
catalog('fi','Pelaa|Todennäköisyyslaboratorio|Harjoitukset|Käsien tarkastelu|Edistyminen|Asetukset|Aloita käsi|Seuraava käsi|Luovuta|Sökötä|Maksa|Panosta|Korota|Kaikki peliin|Potti|Merkkipino|Yhteiset kortit|Sinä|Tauko|Jatka|Yksi vaihe|Näytä laskelma|Piilota vastaus|Harjoittele|Opi|Arvaa ensin|Tarkista vastaus|Seuraava harjoitus|Toista|Varmuuskopioi edistyminen|Tuo varmuuskopio|Nollaa edistyminen|Peruuta|Vahvista|Aloittelijan näkymä|Edistynyt näkymä|Kieli|Vähennä liikettä|Oikea laskelma|Lue selitys|Vastauksesi|Laskelman vaiheet|Laskentatarkkuus|Yritykset|Leikkimerkit|Lasketaan…|Pysäytä laskenta|Vastustajan käsijoukko|Paino|Tunnetut kortit|Odotettu osuus potista|Oletukset|Menetelmä|Otokset|Aloita',`
Kuinka monta korttia muodostaa arvioitavan Hold’em-käden?
A♣ 2♦ 3♥ 4♠ 5♣: mikä on suoran korkein arvo? Ässä = 14.
Pöytä K♣ K♦ 7♥ 4♠ 2♣; paikka 1 A♥ Q♥, paikka 2 A♠ J♠. Kumpi paikka voittaa?
Pöytä A♠ K♠ Q♠ J♠ T♠, kolme pelaajaa. Kuinka monta prosenttia potista kukin saa ennen jakamattomia merkkejä?
Omissa korteissa ja flopissa näkyy neljä herttaa, muita kortteja ei tunneta. Montako hertta-kohdekorttia on jäljellä?
47 tuntematonta korttia, 9 kiinteää kohdetta: seuraavan kortin osumatodennäköisyys prosentteina?
47 tuntematonta korttia, 9 kiinteää kohdetta, kaksi korttia ilman lisäpäätöksiä: vähintään yhden osuman todennäköisyys prosentteina?
Turnilla 46 tuntematonta korttia ja 9 kohdetta jäljellä. Riverin osumaprosentti?
Minkä likimääräisen prosentin neljän sääntö antaa 9 flop-outille ja kahdelle tulevalle kortille?
Montako järjestämätöntä kahden kortin yhdistelmää on 52 eri kortista?
Montako konkreettista QQ-yhdistelmää ilman estokortteja?
Montako AKs-yhdistelmää ilman estokortteja? s tarkoittaa samaa maata.
Montako AKo-yhdistelmää ilman estokortteja? o tarkoittaa eri maita.
Sinulla A♠ 7♦, muita ässiä ei tunneta. Montako AA-yhdistelmää jää?
Kaksi kokonaista kättä ja kolme floppikorttia tunnetaan, ei muita kuolleita kortteja. Montako järjestämätöntä turn/river-paria?
Potti 60, vastustajan panos 20: P = 80, lisämaksu C = 20. Yksi potti, ei tulevaa panostusta: kannattavuusrajan equity prosentteina?
P = 80, C = 20, E = 25%, yksi kelpoinen potti, ei rakea eikä lisäpanostusta. Maksun EV suhteessa luovuttamiseen nyt?
P = 80, C = 20, E = 15%, ei tulevaa panostusta. Maksun EV?
Puhdas bluffi: P0 = 100, B = 50, equity maksettaessa nolla, ei tulevia päätöksiä. Kannattavuusrajan luovutusprosentti?
P0 = 100, B = 50, oletettu luovutustodennäköisyys F = 40%, equity maksettaessa nolla. Bluffin EV?
100 yhtä todennäköistä tulosta: 30 yksinvoittoa, 20 kahden pelaajan tasapeliä, 50 tappiota. Equity prosentteina?
Ennen sokkopanoksia kahdella pelaajalla on 240 ja 90 merkkiä. Mikä on efektiivinen pino?
Kaksi pelaajaa: paikka 1 nappi/pieni sokkopanos, paikka 2 suuri sokkopanos. Molemmat voivat toimia. Kuka toimii ensin ennen floppia?
Malli: P = 80, C = 20, osuma 10%. Osumalla aina voitto ja 100 lisää vastustajalta; ohilyönnillä tappio ilman lisämaksua. Maksun EV?
Perus-EV +5 merkkiä. Erikseen 10% riski menettää vielä 80, ei aiemmin huomioitu. Uusi EV?
Kolme pelaajaa sijoittaa 30, 80 ja 80 merkkiä. Ensimmäinen on all-in. Montako merkkiä kaikkien yhteisessä pääpotissa?
Ilman estokortteja joukossa on vain AA painolla 100% ja KK painolla 50%. AA:n normalisoitu prosenttiosuus?
9 värin kohdekorttia ja 8 suoran kohdekorttia; tasan 2 kuuluu molempiin. Montako erillistä kohdetta?
`, `
Parhaat viisi seitsemästä lasketaan. Omia kortteja voi käyttää nolla, yksi tai kaksi; seitsemää ei arvioida yhdessä.
Ässä on tässä kakkosen alapuolella. Suora ei kierrä ässän kautta takaisin alkuun.
K-K-A:n jälkeen ratkaisee Q-kikkeri J:tä vastaan. Yhteinen ässä ei tee tasapeliä.
Kaikki pelaavat saman kuningasvärisuoran. Maa tai omat kortit eivät ratkaise tasapeliä; jakamattomat merkit noudattavat pöydän sääntöä.
Kohdekortit eivät takaa voittoa. Vastustajakin voi parantaa; parillinen pöytä tai korkeampi väri voi vaikuttaa.
Nimittäjänä on nykyinen tuntemattomien korttien määrä. Kohteeseen osuminen ei tarkoita automaattista voittoa.
Vähennä ykkösestä kahden ohilyönnin todennäköisyys. Yksittäisen mahdollisuuden kaksinkertaistaminen sivuuttaa kortinpoiston ja laskee tuloksia kahdesti.
Tämä on nimetty likiarvo, ei tarkka tulos. Kiinteät kohteet ja kahden kortin todellinen näkeminen ovat oletuksia.
Samojen korttien käänteinen järjestys ei luo uutta yhdistelmää. Ruudukon 169 solua ovat luokkia, eivät konkreettisia käsiä.
Laske yhdistelmät ennen estokortteja. s sisältää saman maan, o eri maat; ilman päätettä molemmat sisältyvät.
Poista vain tunnetut kortit ja normalisoi painot. Simulaattorin salaiset kortit eivät ole tunnettuja estokortteja.
Järjestämättömät parit riittävät lopulliseen equityyn; katukohtaiset päätökset tarvitsevat järjestyksen.
Yksi potti, ei rakea eikä jatkopanostusta. Maksu sisältyy loppupottiin; älä vähennä menneitä maksuja uudelleen. Myöhempi tuuri ei muuta laskelmaa.
Luovutustaajuus on oletus, ei todistettu vastustajan ominaisuus. Puhdas bluffi on positiivinen vain rajan yläpuolella.
Kahden tasapeli vastaa puolta potista. Voitto-, tasapeli- ja tappio-osuudet eroavat equitystä.
Vastustajaa vastaan voidaan kilpailla vain pienemmän saatavilla olevan pinon verran.
Nappi/pieni sokkopanos toimii ensin ennen floppia ja viimeisenä sen jälkeen. Asema ei yksin anna ratkaistua strategiaa.
Lisämaksu edellyttää osumaa ja voittoa. Oikea vastustaja ei välttämättä maksa; tulevat omat kulut ja likaiset outit täytyy huomioida.
Vähennä odotettu lisätappio kerran. Pelkkä equity ei ennusta tätä oletettua tulevaa maksua.
Vain kelpoiset pelaajat voivat voittaa kyseisen potin. Pää- ja sivupotti tarvitsevat erilliset equityt.
Painot koskevat jokaista yhdistelmää ja jaetaan kokonaispainolla. Solun paino ei ole lopullinen todennäköisyys.
Vähennä päällekkäisyys kerran kaksoislaskennan välttämiseksi. Erilliset kohteet eivät välttämättä ole puhtaita voitto-outteja.
`);
