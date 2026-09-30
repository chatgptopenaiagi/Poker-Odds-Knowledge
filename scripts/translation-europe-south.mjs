import {catalog} from './translation-build.mjs';
catalog('pt','Jogar|Laboratório de probabilidades|Exercícios|Rever mãos|Progresso|Definições|Iniciar mão|Próxima mão|Desistir|Passar|Pagar|Apostar|Aumentar|Tudo dentro|Pote|Pilha|Mesa|Você|Pausa|Continuar|Um passo|Mostrar cálculo|Ocultar resposta|Prática|Aprender|Responder primeiro|Verificar resposta|Próximo exercício|Repetir|Guardar progresso|Importar cópia|Repor progresso|Cancelar|Confirmar|Vista iniciante|Vista avançada|Idioma|Reduzir movimento|Cálculo correto|Rever explicação|Sua resposta|Cálculo explicado|Precisão dos cálculos|Tentativas|Fichas de jogo|A calcular…|Parar cálculo|Intervalo adversário|Peso|Cartas conhecidas|Parte esperada do pote|Hipóteses|Método|Amostras|Começar',`
Quantas cartas formam a mão avaliada no Hold’em?
A♣ 2♦ 3♥ 4♠ 5♣: qual é o maior valor desta sequência? Ás = 14.
Mesa K♣ K♦ 7♥ 4♠ 2♣; lugar 1 A♥ Q♥, lugar 2 A♠ J♠. Qual lugar ganha?
Mesa A♠ K♠ Q♠ J♠ T♠, três jogadores. Que percentagem do pote cabe a cada um antes das fichas indivisíveis?
Vê quatro copas entre suas cartas e o flop, sem outras cartas conhecidas. Quantas copas-alvo restam?
47 cartas desconhecidas e 9 alvos fixos: probabilidade percentual de acertar na próxima carta?
47 cartas desconhecidas, 9 alvos fixos, duas cartas sem novas decisões: percentagem de pelo menos um acerto?
No turn há 46 cartas desconhecidas e 9 alvos disponíveis. Qual a percentagem de acerto no river?
Que percentagem aproximada dá a regra de quatro com 9 outs no flop e duas cartas por ver?
Quantas combinações não ordenadas de duas cartas existem entre 52 cartas distintas?
Quantas combinações concretas de QQ existem sem bloqueadores?
Quantas combinações AKs existem sem bloqueadores? s significa mesmo naipe.
Quantas combinações AKo existem sem bloqueadores? o significa naipes diferentes.
Tem A♠ 7♦, sem outros ases conhecidos. Quantas combinações AA restam?
Duas mãos completas e três cartas do flop conhecidas, sem outras cartas mortas. Quantos pares turn/river não ordenados existem?
Pote 60, aposta adversária 20: P = 80, pagamento adicional C = 20. Um pote, sem apostas futuras: qual a equidade percentual de equilíbrio?
P = 80, C = 20, E = 25%, um pote elegível, sem comissão nem apostas futuras. Qual o EV de pagar comparado com desistir agora?
P = 80, C = 20, E = 15%, sem apostas futuras. Qual o EV de pagar?
Blefe puro: P0 = 100, B = 50, equidade zero se pago, sem decisões futuras. Que percentagem de desistências atinge o equilíbrio?
P0 = 100, B = 50, desistência suposta F = 40%, equidade zero se pago. Qual o EV do blefe?
100 resultados equiprováveis: 30 vitórias isoladas, 20 empates a dois, 50 derrotas. Qual a equidade percentual?
Antes das blinds, dois jogadores têm 240 e 90 fichas. Qual a pilha efetiva?
Dois jogadores: lugar 1 botão/small blind, lugar 2 big blind. Ambos podem agir. Quem age primeiro pré-flop?
Modelo: P = 80, C = 20, acerto 10%. Ao acertar ganha sempre e recebe mais 100 do adversário; ao falhar perde sem pagar mais. EV de pagar?
EV inicial +5 fichas. Separadamente há 10% de perder mais 80, ainda não contabilizados. Novo EV?
Três jogadores contribuem 30, 80 e 80 fichas. O primeiro está all-in. Quantas fichas no pote principal acessível aos três?
Sem bloqueadores, o intervalo contém apenas AA com peso 100% e KK com 50%. Que percentagem normalizada é AA?
9 alvos de flush e 8 de sequência; exatamente 2 pertencem aos dois conjuntos. Quantos alvos distintos?
`, `
Contam as cinco melhores entre sete. Pode usar zero, uma ou duas cartas próprias; sete não são avaliadas como uma mão.
O ás fica abaixo do dois nesta sequência. Não se pode dar a volta passando pelo ás.
Depois de K-K-A, o kicker Q vence J. O ás partilhado não cria empate.
Todos usam a mesma sequência real. Naipe e cartas privadas não desempatem; fichas indivisíveis seguem a regra da mesa.
Alvos não garantem vitória. O adversário também pode melhorar; mesa emparelhada ou flush superior podem importar.
O denominador usa as cartas atualmente desconhecidas. Acertar o alvo não é automaticamente ganhar.
Subtraia de um a probabilidade de falhar duas vezes. Somar probabilidades iguais ignora a remoção e duplica resultados.
É uma aproximação declarada, diferente do resultado exato. Pressupõe alvos fixos e ver realmente duas cartas.
A ordem das mesmas duas cartas não cria outra combinação. As 169 células são classes, não mãos concretas.
Conte combinações antes dos bloqueadores. s inclui mesmo naipe, o naipes diferentes; sem sufixo incluem-se ambos.
Retire apenas cartas conhecidas e normalize os pesos. Segredos do simulador não são bloqueadores conhecidos.
Pares não ordenados bastam para equidade final; decisões por ronda precisam da ordem.
Um pote, sem comissão nem apostas futuras. O pagamento entra no pote final; não desconte contribuições passadas novamente. Sorte posterior não altera o cálculo.
A taxa de desistência é uma hipótese, não uma propriedade provada do adversário. Só acima do limiar o blefe puro tem EV positivo.
Um empate a dois vale meio pote. Frequências de vitória, empate e derrota diferem da equidade.
Só a menor pilha disponível pode ser disputada contra aquele adversário.
Botão/small blind age primeiro pré-flop e por último depois do flop. Posição não fornece uma estratégia resolvida.
O extra exige acerto e vitória. Adversários reais podem não pagar; custos próprios futuros e outs sujos também contam.
Subtraia a perda adicional esperada uma vez. Equidade bruta não prevê este pagamento futuro suposto.
Apenas jogadores elegíveis ganham cada pote. Pote principal e lateral precisam de equidades separadas.
Pesos valem por combinação e são divididos pela soma total. O peso da célula não é a probabilidade final.
Subtraia a interseção uma vez para evitar duplicações. Alvos distintos ainda podem não ser outs vencedores.
`);
catalog('it','Gioca|Laboratorio delle probabilità|Esercizi|Rivedi mani|Progressi|Impostazioni|Inizia mano|Mano successiva|Lascia|Passa|Vedi|Punta|Rilancia|All-in|Piatto|Stack|Carte comuni|Tu|Pausa|Riprendi|Un passo|Mostra calcolo|Nascondi risposta|Pratica|Impara|Rispondi prima|Verifica risposta|Prossimo esercizio|Ripeti|Salva progressi|Importa copia|Azzera progressi|Annulla|Conferma|Vista principiante|Vista avanzata|Lingua|Riduci movimento|Calcolo corretto|Rivedi spiegazione|La tua risposta|Calcolo spiegato|Precisione dei calcoli|Tentativi|Fiches di gioco|Calcolo in corso…|Ferma calcolo|Range avversario|Peso|Carte note|Quota attesa del piatto|Ipotesi|Metodo|Campioni|Inizia',`
Quante carte formano la mano valutata nel Hold’em?
A♣ 2♦ 3♥ 4♠ 5♣: qual è il valore più alto di questa scala? Asso = 14.
Board K♣ K♦ 7♥ 4♠ 2♣; posto 1 A♥ Q♥, posto 2 A♠ J♠. Quale posto vince?
Board A♠ K♠ Q♠ J♠ T♠, tre giocatori. Quale percentuale del piatto spetta a ciascuno prima delle fiches indivisibili?
Vedi quattro cuori fra le tue carte e il flop, senza altre carte note. Quanti cuori bersaglio restano?
47 carte sconosciute, 9 bersagli fissi: probabilità percentuale di colpire con la prossima carta?
47 carte sconosciute, 9 bersagli fissi, due carte senza altre decisioni: percentuale di almeno un successo?
Al turn ci sono 46 carte sconosciute e 9 bersagli disponibili. Percentuale di successo al river?
Quale percentuale approssimata dà la regola del quattro con 9 outs al flop e due carte da vedere?
Quante combinazioni non ordinate di due carte esistono fra 52 carte distinte?
Quante combinazioni concrete di QQ senza blocker?
Quante combinazioni AKs senza blocker? s significa stesso seme.
Quante combinazioni AKo senza blocker? o significa semi diversi.
Hai A♠ 7♦, nessun altro asso noto. Quante combinazioni AA restano?
Due mani complete e tre carte del flop note, nessun’altra carta morta nota. Quante coppie turn/river non ordinate?
Piatto 60, puntata avversaria 20: P = 80, call aggiuntivo C = 20. Un piatto, nessuna puntata futura: equity percentuale di pareggio?
P = 80, C = 20, E = 25%, un piatto ammesso, niente rake o puntate future. EV del call rispetto a lasciare ora?
P = 80, C = 20, E = 15%, niente puntate future. EV del call?
Bluff puro: P0 = 100, B = 50, equity zero se chiamato, nessuna decisione futura. Percentuale di fold di pareggio?
P0 = 100, B = 50, fold ipotizzato F = 40%, equity zero se chiamato. EV del bluff?
100 esiti equiprobabili: 30 vittorie sole, 20 pareggi a due, 50 sconfitte. Equity percentuale?
Prima dei bui, due giocatori hanno 240 e 90 fiches. Stack effettivo?
Testa a testa: posto 1 bottone/piccolo buio, posto 2 grande buio. Entrambi possono agire. Chi agisce per primo preflop?
Modello: P = 80, C = 20, successo 10%. Se colpisci vinci sempre e ricevi altri 100 dall’avversario; altrimenti perdi senza altri pagamenti. EV del call?
EV iniziale +5 fiches. Separatamente c’è il 10% di perdere altre 80, non ancora conteggiate. Nuovo EV?
Tre giocatori versano 30, 80 e 80 fiches. Il primo è all-in. Quante fiches nel piatto principale accessibile a tutti?
Senza blocker, range composto solo da AA con peso 100% e KK con 50%. Percentuale normalizzata di AA?
9 bersagli per colore e 8 per scala; esattamente 2 sono comuni. Quanti bersagli distinti?
`, `
Contano le migliori cinque fra sette. Puoi usare zero, una o due carte private; sette carte non formano la mano valutata.
Qui l’asso vale sotto il due. Una scala non può proseguire ciclicamente oltre l’asso.
Dopo K-K-A decide il kicker Q contro J. L’asso comune non implica pareggio.
Tutti giocano la stessa scala reale. Semi e carte private non rompono il pareggio; le fiches dispari seguono la regola del tavolo.
Un bersaglio non garantisce vittoria. Anche l’avversario può migliorare; board appaiati e colori maggiori possono contare.
Il denominatore usa le carte attualmente sconosciute. Colpire un bersaglio non equivale automaticamente a vincere.
Sottrai da uno la probabilità di mancare due volte. Sommare probabilità identiche ignora la rimozione e duplica alcuni esiti.
È un’approssimazione dichiarata, diversa dal valore esatto. Presuppone bersagli fissi e due carte effettivamente viste.
L’ordine delle stesse due carte non crea un’altra combinazione. Le 169 celle sono classi, non mani concrete.
Conta combinazioni prima dei blocker. s include lo stesso seme, o semi diversi; senza suffisso sono inclusi entrambi.
Rimuovi solo carte note, poi normalizza i pesi. Le carte segrete del simulatore non sono blocker noti.
Le coppie non ordinate bastano per l’equity finale; le decisioni per strada richiedono l’ordine.
Un piatto, niente rake né puntate future. Il call entra nel piatto finale; non sottrarre nuovamente contributi passati. La fortuna successiva non cambia il calcolo.
La frequenza di fold è un’ipotesi, non una proprietà dimostrata dell’avversario. Il bluff puro è positivo solo sopra la soglia.
Un pareggio a due vale mezzo piatto. Frequenze di vittoria, pareggio e sconfitta sono diverse dall’equity.
Contro un avversario si può contendere soltanto lo stack minore disponibile.
Bottone/piccolo buio agisce prima preflop e ultimo dopo il flop. La posizione non fornisce da sola una strategia risolta.
Il pagamento extra richiede successo e vittoria. Avversari reali possono non pagare; vanno contati costi futuri propri e outs sporchi.
Sottrai una sola volta la perdita aggiuntiva attesa. L’equity grezza non prevede questo pagamento futuro ipotizzato.
Solo i giocatori aventi diritto possono vincere ciascun piatto. Piatto principale e laterale richiedono equity separate.
I pesi valgono per combinazione e si dividono per la somma totale. Il peso di una cella non è già la sua probabilità.
Sottrai l’intersezione una volta per evitare duplicati. Bersagli distinti non sono necessariamente outs vincenti puliti.
`);
catalog('nl','Spelen|Kansenlab|Oefeningen|Handbespreking|Voortgang|Instellingen|Hand starten|Volgende hand|Folden|Checken|Callen|Inzetten|Verhogen|All-in|Pot|Stapel|Gemeenschappelijke kaarten|Jij|Pauze|Doorgaan|Eén stap|Berekening tonen|Antwoord verbergen|Oefenen|Leren|Eerst raden|Antwoord controleren|Volgende oefening|Herhalen|Voortgang opslaan|Back-up importeren|Voortgang wissen|Annuleren|Bevestigen|Beginnersweergave|Geavanceerde weergave|Taal|Minder beweging|Juiste berekening|Uitleg bekijken|Jouw antwoord|Uitgewerkte berekening|Rekennauwkeurigheid|Pogingen|Speelfiches|Berekenen…|Berekening stoppen|Range tegenstander|Gewicht|Bekende kaarten|Verwacht potaandeel|Aannames|Methode|Steekproeven|Beginnen',`
Hoeveel kaarten vormen de beoordeelde Hold’em-hand?
A♣ 2♦ 3♥ 4♠ 5♣: wat is de hoogste rang van deze straat? Aas = 14.
Board K♣ K♦ 7♥ 4♠ 2♣; stoel 1 A♥ Q♥, stoel 2 A♠ J♠. Welke stoel wint?
Board A♠ K♠ Q♠ J♠ T♠, drie spelers. Welk percentage krijgt ieder vóór ondeelbare fiches?
Vier harten zichtbaar in jouw kaarten en de flop, geen andere bekende kaarten. Hoeveel hartendoelkaarten blijven over?
47 onbekende kaarten, 9 vaste doelen: trefkans op de volgende kaart in procenten?
47 onbekende kaarten, 9 vaste doelen, twee kaarten zonder verdere beslissingen: kans op minstens één treffer in procenten?
Op de turn zijn 46 kaarten onbekend en 9 doelen beschikbaar. Trefkans op de river in procenten?
Welk benaderd percentage geeft de vierregel bij 9 flop-outs en twee komende kaarten?
Hoeveel ongeordende combinaties van twee kaarten uit 52 verschillende kaarten?
Hoeveel concrete QQ-combinaties zonder blockers?
Hoeveel AKs-combinaties zonder blockers? s betekent dezelfde soort.
Hoeveel AKo-combinaties zonder blockers? o betekent verschillende soorten.
Je hebt A♠ 7♦, geen andere azen bekend. Hoeveel AA-combinaties blijven over?
Twee volledige handen en drie flopkaarten bekend, geen andere dode kaarten. Hoeveel ongeordende turn/river-paren?
Pot 60, inzet tegenstander 20: P = 80, extra call C = 20. Eén pot, geen verdere inzetten: break-even equity in procenten?
P = 80, C = 20, E = 25%, één toegankelijke pot, geen rake of toekomstige inzetten. Call-EV tegenover nu folden?
P = 80, C = 20, E = 15%, geen toekomstige inzetten. Call-EV?
Pure bluf: P0 = 100, B = 50, nul equity bij een call, geen latere beslissingen. Break-even foldpercentage?
P0 = 100, B = 50, aangenomen foldkans F = 40%, nul equity bij een call. Bluf-EV?
100 even waarschijnlijke uitkomsten: 30 losse overwinningen, 20 tweepersoonsdelingen, 50 verliezen. Equity in procenten?
Vóór de blinds hebben twee spelers 240 en 90 fiches. Wat is de effectieve stack?
Heads-up: stoel 1 button/small blind, stoel 2 big blind. Beiden kunnen handelen. Wie handelt eerst preflop?
Model: P = 80, C = 20, trefkans 10%. Bij treffen altijd winst plus 100 extra van tegenstander; bij missen verlies zonder meer betaling. Call-EV?
Basis-EV +5 fiches. Afzonderlijk is er 10% kans op 80 extra verlies, nog niet meegeteld. Nieuwe EV?
Drie spelers betalen 30, 80 en 80 fiches. De eerste is all-in. Hoe groot is de hoofdpot voor alle drie?
Zonder blockers bevat een range alleen AA met gewicht 100% en KK met 50%. Welk genormaliseerd percentage is AA?
9 flushdoelen en 8 straatdoelen; precies 2 kaarten behoren tot beide groepen. Hoeveel verschillende doelen?
`, `
De beste vijf van zeven tellen. Je mag nul, één of twee eigen kaarten gebruiken; zeven kaarten worden niet samen gerangschikt.
De aas staat hier onder de twee. Een straat kan niet om de aas heen doorlopen.
Na K-K-A beslist kicker Q tegen J. De gedeelde aas geeft geen gelijkspel.
Iedereen speelt dezelfde royal flush. Soort en eigen kaarten verbreken geen gelijkspel; ondeelbare fiches volgen de tafelregel.
Doelkaarten garanderen geen winst. Tegenstanders kunnen verbeteren; gepaarde boards en hogere flushes kunnen meetellen.
De noemer gebruikt de huidige onbekende kaarten. Een doel raken is niet automatisch winnen.
Trek tweemaal missen af van één. Dezelfde kans tweemaal optellen negeert kaartverwijdering en telt uitkomsten dubbel.
Dit is een benoemde benadering, anders dan de exacte kans. Vaste doelen en werkelijk twee kaarten zien zijn vereist.
De volgorde van dezelfde twee kaarten maakt geen nieuwe combinatie. De 169 vakken zijn klassen, geen concrete handen.
Tel combinaties vóór blockers. s omvat dezelfde soort, o verschillende soorten; zonder achtervoegsel tellen beide mee.
Verwijder alleen bekende kaarten en normaliseer daarna gewichten. Geheime simulatorkaarten zijn geen bekende blockers.
Ongeordende paren volstaan voor eind-equity; beslissingen per straat hebben de volgorde nodig.
Eén pot, geen rake of latere inzetten. De call zit in de eindpot; trek eerdere bijdragen niet opnieuw af. Latere gelukstreffers veranderen de berekening niet.
De foldfrequentie is een aanname, geen bewezen eigenschap van de tegenstander. Alleen boven de grens is de pure bluf positief.
Een gelijkspel met twee telt als een halve pot. Winst-, gelijkspel- en verliesfrequenties verschillen van equity.
Tegen één tegenstander kan alleen de kleinste beschikbare stack worden betwist.
Button/small blind handelt eerst preflop en laatst na de flop. Positie levert op zichzelf geen opgeloste strategie.
Extra betaling vereist treffen én winnen. Echte tegenstanders betalen mogelijk niet; toekomstige eigen kosten en onzuivere outs tellen ook.
Trek het verwachte extra verlies eenmaal af. Ruwe equity voorspelt deze aangenomen toekomstige betaling niet.
Alleen gerechtigde spelers kunnen een pot winnen. Hoofd- en zijpot vereisen afzonderlijke equity.
Gewichten gelden per combinatie en worden gedeeld door hun totale som. Een celgewicht is nog geen kans.
Trek de overlap eenmaal af om dubbel tellen te vermijden. Verschillende doelen zijn niet noodzakelijk zuivere winnende outs.
`);
