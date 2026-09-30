import {catalog} from './translation-build.mjs';
catalog('de','Spielen|Chancenlabor|Übungen|Handanalyse|Fortschritt|Einstellungen|Hand starten|Nächste Hand|Passen|Schieben|Mitgehen|Setzen|Erhöhen|All-in|Pot|Stapel|Gemeinschaftskarten|Du|Pause|Fortsetzen|Einzelschritt|Berechnung zeigen|Antwort verbergen|Üben|Lernen|Zuerst schätzen|Antwort prüfen|Nächste Übung|Wiederholen|Fortschritt sichern|Sicherung importieren|Fortschritt zurücksetzen|Abbrechen|Bestätigen|Anfängeransicht|Erweiterte Ansicht|Sprache|Weniger Bewegung|Richtige Berechnung|Erklärung ansehen|Deine Antwort|Rechenweg|Rechengenauigkeit|Versuche|Spielchips|Berechnung läuft…|Berechnung stoppen|Gegnerische Range|Gewicht|Bekannte Karten|Erwarteter Potanteil|Annahmen|Methode|Stichproben|Loslegen',`
Wie viele Karten bilden die bewertete Hold’em-Hand?
A♣ 2♦ 3♥ 4♠ 5♣: Welchen höchsten Rang hat diese Straße? Ass = 14.
Board K♣ K♦ 7♥ 4♠ 2♣; Platz 1 A♥ Q♥, Platz 2 A♠ J♠. Welcher Platz gewinnt?
Board A♠ K♠ Q♠ J♠ T♠, drei Spieler. Welchen Potanteil in Prozent erhält jeder vor unteilbaren Chips?
Vier Herzen sind unter deinen Karten und dem Flop sichtbar. Keine weiteren bekannten Karten: Wie viele Herz-Zielkarten bleiben?
47 unbekannte Karten, 9 feste Zielkarten: Wie hoch ist die Trefferwahrscheinlichkeit der nächsten Karte in Prozent?
47 unbekannte Karten, 9 feste Ziele, zwei Karten ohne weitere Entscheidungen: Wahrscheinlichkeit mindestens eines Treffers in Prozent?
Am Turn sind 46 Karten unbekannt und 9 Ziele verfügbar. Wie hoch ist die Trefferwahrscheinlichkeit am River in Prozent?
Welche ungefähre Prozentzahl ergibt die Viererregel bei 9 Flop-Outs und zwei kommenden Karten?
Wie viele ungeordnete Zweikartenkombinationen gibt es aus 52 verschiedenen Karten?
Wie viele konkrete QQ-Kombinationen gibt es ohne Blocker?
Wie viele AKs-Kombinationen gibt es ohne Blocker? s bedeutet gleiche Farbe.
Wie viele AKo-Kombinationen gibt es ohne Blocker? o bedeutet verschiedene Farben.
Du hältst A♠ 7♦; keine weiteren Asse sind bekannt. Wie viele AA-Kombinationen bleiben?
Zwei vollständige Hände und drei Flopkarten sind bekannt, keine weiteren toten Karten. Wie viele ungeordnete Turn/River-Paare gibt es?
Pot 60, gegnerischer Einsatz 20: P = 80, zusätzlicher Call C = 20. Ein Pot, kein weiteres Setzen: Welche Equity in Prozent erreicht die Gewinnschwelle?
P = 80, C = 20, E = 25%; ein berechtigter Pot, kein Rake, keine weiteren Einsätze. Wie hoch ist der Call-EV gegenüber sofortigem Passen?
P = 80, C = 20, E = 15%, keine weiteren Einsätze. Wie hoch ist der Call-EV?
Reiner Bluff: P0 = 100, B = 50, Equity bei einem Call null, keine weiteren Entscheidungen. Welche Fold-Quote in Prozent erreicht die Gewinnschwelle?
P0 = 100, B = 50, angenommene Fold-Quote F = 40%, Equity bei einem Call null. Wie hoch ist der Bluff-EV?
100 gleich wahrscheinliche Ergebnisse: 30 alleinige Siege, 20 Zweierteilungen, 50 Niederlagen. Wie hoch ist die Equity in Prozent?
Zwei Spieler besitzen vor den Blinds 240 und 90 Chips. Wie groß ist der effektive Stack?
Heads-up: Platz 1 Button/Small Blind, Platz 2 Big Blind. Beide können handeln. Wer beginnt vor dem Flop?
Modell: P = 80, C = 20, Trefferchance 10%. Bei Treffer immer Sieg und 100 zusätzliche gegnerische Chips; sonst Verlust ohne weitere Zahlung. Call-EV?
Basis-EV +5 Chips. Separat tritt mit 10% Wahrscheinlichkeit ein zusätzlicher Verlust von 80 ein, bisher nicht berücksichtigt. Neuer EV?
Drei Spieler zahlen 30, 80 und 80 Chips ein. Der erste ist all-in. Wie groß ist der Hauptpot für alle drei?
Ohne Blocker enthält eine Range nur AA mit Gewicht 100% und KK mit 50%. Wie hoch ist der normalisierte AA-Anteil in Prozent?
9 Flush-Zielkarten und 8 Straßen-Zielkarten; genau 2 gehören zu beiden Mengen. Wie viele verschiedene Ziele gibt es?
`, `
Die besten fünf aus sieben zählen. Null, eine oder zwei eigene Karten dürfen verwendet werden; sieben Karten bilden keine bewertete Hand.
Das Ass zählt hier unter der Zwei. Eine Straße darf nicht über das Ass hinweg umlaufen.
Nach K-K-A entscheidet der nächste Kicker Q gegen J. Das gemeinsame Ass bedeutet kein Unentschieden.
Alle spielen dasselbe Royal Flush. Weder Farbe noch eigene Karten brechen die Gleichheit; unteilbare Chips folgen der Tischregel.
Zielkarten sind keine garantierten Gewinnkarten. Gegner können ebenfalls besser werden; ein gepaartes Board oder ein höherer Flush kann relevant sein.
Der Nenner enthält nur die aktuell unbekannten Karten. Das Ergebnis ist eine Zieltrefferchance, nicht automatisch Gewinnwahrscheinlichkeit.
Ziehe zweimaliges Verfehlen von eins ab. Zweimal dieselbe Einzelchance zu addieren ignoriert Kartenentnahme und zählt manche Ergebnisse doppelt.
Dies ist ausdrücklich eine Näherung. Die exakte Chance bei festen Zielen ist anders; außerdem müssen tatsächlich zwei Karten gesehen werden.
Die Reihenfolge derselben zwei Karten zählt nicht doppelt. 169 Rasterfelder sind Klassen und keine konkreten Hände.
Es werden konkrete Kombinationen vor Blockern gezählt. s umfasst nur gleiche Farben, o nur verschiedene; ohne Suffix sind beide enthalten.
Entferne nur bekannte Karten und normalisiere anschließend die Gewichte. Verborgene Simulatorkarten sind keine bekannten Blocker.
Ungeordnete Paare reichen für die abschließende Showdown-Equity; Entscheidungen auf einzelnen Straßen brauchen die Reihenfolge.
Ein Pot, kein Rake, keine weiteren Einsätze. Der zusätzliche Call gehört zum Endpot; frühere Beiträge werden nicht erneut abgezogen. Späteres Glück ändert diese Rechnung nicht.
Die Fold-Quote ist eine Annahme, keine gemessene Gegnereigenschaft. Nur oberhalb der Gewinnschwelle wird der reine Bluff positiv.
Ein Zweier-Unentschieden zählt als halber Pot. Sieg-, Gleichstands- und Verlusthäufigkeiten unterscheiden sich vom erwarteten Potanteil.
Gegen einen Gegner kann nur dessen verfügbarer kleinerer Stapel ausgespielt werden.
Der Button/Small Blind beginnt vor dem Flop und handelt nach dem Flop zuletzt. Position allein ist keine gelöste Strategie.
Die zusätzliche Zahlung wird nur bei Treffer und Sieg angenommen. Echte Gegner zahlen eventuell nicht; weitere eigene Kosten und unsaubere Outs müssen berücksichtigt werden.
Ziehe den erwarteten zusätzlichen Verlust genau einmal ab. Roh-Equity bestimmt diese angenommene zukünftige Zahlung nicht.
Nur berechtigte Spieler können einen Pot gewinnen. Haupt- und Nebenpot benötigen getrennte Equity-Betrachtungen.
Gewichte gelten pro Kombination und werden durch ihre Gesamtsumme geteilt. Das Zellgewicht allein ist noch keine Wahrscheinlichkeit.
Ziehe die Überschneidung einmal ab, damit keine Karte doppelt zählt. Auch verschiedene Ziele garantieren keinen Sieg.
`);
catalog('fr','Jouer|Laboratoire des probabilités|Exercices|Revoir les mains|Progression|Paramètres|Commencer une main|Main suivante|Se coucher|Parole|Suivre|Miser|Relancer|Tapis|Pot|Tapis disponible|Tableau|Vous|Pause|Reprendre|Une étape|Voir le calcul|Masquer la réponse|Pratique|Apprendre|Répondre d’abord|Vérifier la réponse|Exercice suivant|Rejouer|Sauvegarder la progression|Importer une sauvegarde|Réinitialiser la progression|Annuler|Confirmer|Vue débutant|Vue avancée|Langue|Réduire les animations|Calcul correct|Revoir l’explication|Votre réponse|Calcul détaillé|Précision des calculs|Tentatives|Jetons fictifs|Calcul en cours…|Arrêter le calcul|Éventail adverse|Poids|Cartes connues|Part moyenne du pot|Hypothèses|Méthode|Échantillons|Commencer',`
Combien de cartes composent la main classée au Hold’em ?
A♣ 2♦ 3♥ 4♠ 5♣ : quel est le rang supérieur de cette suite ? As = 14.
Tableau K♣ K♦ 7♥ 4♠ 2♣ ; siège 1 A♥ Q♥, siège 2 A♠ J♠. Quel siège gagne ?
Tableau A♠ K♠ Q♠ J♠ T♠, trois joueurs. Quel pourcentage du pot revient à chacun avant les jetons indivisibles ?
Quatre cœurs sont visibles parmi vos cartes et le flop. Aucune autre carte connue : combien de cœurs cibles restent ?
47 cartes inconnues, 9 cibles fixes : probabilité en pourcentage de toucher à la prochaine carte ?
47 cartes inconnues, 9 cibles fixes, deux cartes vues sans autre décision : probabilité en pourcentage d’au moins une cible ?
À la turn, 46 cartes inconnues et 9 cibles disponibles : probabilité en pourcentage de toucher à la river ?
Quel pourcentage approximatif donne la règle de quatre pour 9 outs au flop et deux cartes à venir ?
Combien de combinaisons non ordonnées de deux cartes parmi 52 cartes distinctes ?
Combien de combinaisons concrètes de QQ sans bloqueurs ?
Combien de combinaisons AKs sans bloqueurs ? s signifie assorties.
Combien de combinaisons AKo sans bloqueurs ? o signifie dépareillées.
Vous avez A♠ 7♦ ; aucun autre as connu. Combien de combinaisons AA restent ?
Deux mains complètes et trois cartes du flop sont connues, aucune autre carte morte. Combien de paires turn/river non ordonnées ?
Pot 60, mise adverse 20 : P = 80, coût supplémentaire C = 20. Un seul pot, aucune mise future : quelle équité en pourcentage atteint l’équilibre ?
P = 80, C = 20, E = 25%, un pot admissible, aucun prélèvement ni mise future. Quelle EV pour suivre plutôt que se coucher maintenant ?
P = 80, C = 20, E = 15%, aucune mise future. Quelle EV pour suivre ?
Bluff pur : P0 = 100, B = 50, équité nulle si suivi, aucune décision future. Quel pourcentage d’abandon atteint l’équilibre ?
P0 = 100, B = 50, abandon supposé F = 40%, équité nulle si suivi. Quelle EV du bluff ?
100 résultats équiprobables : 30 victoires seules, 20 partages à deux, 50 défaites. Quel pourcentage d’équité ?
Avant les blindes, deux joueurs ont 240 et 90 jetons. Quel est le tapis effectif ?
Tête-à-tête : siège 1 bouton/petite blinde, siège 2 grosse blinde. Les deux peuvent agir. Qui agit en premier préflop ?
Modèle : P = 80, C = 20, réussite 10%. En cas de réussite, victoire certaine et 100 jetons adverses supplémentaires ; sinon perte sans autre paiement. EV du suivi ?
EV initiale +5 jetons. Séparément, une perte supplémentaire de 80 survient avec 10% de probabilité, non encore comptée. Nouvelle EV ?
Trois joueurs engagent 30, 80 et 80 jetons. Le premier est à tapis. Combien dans le pot principal accessible aux trois ?
Sans bloqueurs, l’éventail contient seulement AA à 100% et KK à 50%. Quel pourcentage normalisé correspond à AA ?
9 cartes cibles de couleur et 8 de suite ; exactement 2 appartiennent aux deux groupes. Combien de cibles distinctes ?
`, `
Les cinq meilleures parmi sept comptent. Vous pouvez utiliser zéro, une ou deux cartes privées ; on ne classe pas sept cartes ensemble.
L’as se place ici sous le deux. Une suite ne peut pas reboucler au-delà de l’as.
Après K-K-A, le kicker Q bat J. L’as commun ne suffit pas à créer une égalité.
Tous utilisent la même quinte royale. Ni couleur ni cartes privées ne départagent ; les jetons indivisibles suivent la règle de table.
Une carte cible ne garantit pas la victoire. L’adversaire peut aussi progresser ; un tableau doublé ou une couleur supérieure peuvent compter.
Le dénominateur est le nombre actuel de cartes inconnues. Toucher une cible n’est pas automatiquement gagner.
Soustrayez à un la probabilité de manquer deux fois. Additionner deux probabilités identiques ignore le retrait des cartes et compte certains résultats deux fois.
C’est une approximation explicitement étiquetée. La probabilité exacte avec cibles fixes diffère et suppose de voir effectivement deux cartes.
L’ordre des deux mêmes cartes ne crée pas une nouvelle combinaison. Les 169 cases représentent des classes, pas des mains concrètes.
On compte les combinaisons concrètes avant bloqueurs. s garde les couleurs identiques, o les couleurs différentes ; sans suffixe, les deux sont incluses.
Retirez uniquement les cartes connues, puis normalisez les poids. Les cartes secrètes du simulateur ne sont pas des bloqueurs connus.
Les paires non ordonnées suffisent pour l’équité finale à l’abattage ; les décisions par rue nécessitent l’ordre.
Un seul pot, aucun prélèvement ni mise future. Le suivi entre dans le pot final ; les contributions passées ne sont pas déduites de nouveau. La chance ultérieure ne change pas ce calcul.
La fréquence d’abandon est une hypothèse, pas une propriété démontrée de l’adversaire. Le bluff pur devient positif seulement au-dessus du seuil.
Une égalité à deux vaut la moitié du pot. Fréquences de victoire, égalité et défaite ne sont pas l’équité.
Face à un adversaire, seul le plus petit tapis disponible peut être disputé.
Le bouton/petite blinde agit d’abord préflop, puis en dernier après le flop. La position seule ne fournit pas une stratégie résolue.
Le paiement supplémentaire suppose réussite et victoire. Un adversaire réel peut refuser ; il faut aussi compter vos coûts futurs et les outs imparfaits.
Déduisez la perte future attendue une seule fois. L’équité brute ne prédit pas ce paiement supposé.
Seuls les joueurs admissibles peuvent gagner un pot. Pot principal et pot annexe demandent des équités séparées.
Les poids portent sur chaque combinaison et sont divisés par leur somme. Le poids d’une case n’est pas directement une probabilité.
Retirez une fois l’intersection pour éviter les doublons. Même des cibles distinctes ne garantissent pas la victoire.
`);
catalog('es','Jugar|Laboratorio de probabilidades|Ejercicios|Revisión de manos|Progreso|Ajustes|Iniciar mano|Siguiente mano|Retirarse|Pasar|Igualar|Apostar|Subir|Todo dentro|Bote|Pila|Mesa|Tú|Pausa|Continuar|Un paso|Mostrar cálculo|Ocultar respuesta|Práctica|Aprender|Responder primero|Comprobar respuesta|Siguiente ejercicio|Repetir|Respaldar progreso|Importar respaldo|Restablecer progreso|Cancelar|Confirmar|Vista principiante|Vista avanzada|Idioma|Reducir movimiento|Cálculo correcto|Revisar explicación|Tu respuesta|Cálculo explicado|Precisión de cálculo|Intentos|Fichas de juego|Calculando…|Detener cálculo|Rango rival|Peso|Cartas conocidas|Parte esperada del bote|Supuestos|Método|Muestras|Comenzar',`
¿Cuántas cartas forman la mano evaluada en Hold’em?
A♣ 2♦ 3♥ 4♠ 5♣: ¿cuál es el rango superior de esta escalera? As = 14.
Mesa K♣ K♦ 7♥ 4♠ 2♣; asiento 1 A♥ Q♥, asiento 2 A♠ J♠. ¿Qué asiento gana?
Mesa A♠ K♠ Q♠ J♠ T♠, tres jugadores. ¿Qué porcentaje del bote corresponde a cada uno antes de repartir fichas indivisibles?
Ves cuatro corazones entre tus cartas y el flop. No hay más cartas conocidas. ¿Cuántos corazones objetivo quedan?
47 cartas desconocidas y 9 objetivos fijos: ¿probabilidad porcentual de acertar con la próxima carta?
47 cartas desconocidas, 9 objetivos fijos y dos cartas sin más decisiones: ¿probabilidad porcentual de al menos un acierto?
En el turn quedan 46 cartas desconocidas y 9 objetivos: ¿porcentaje de acierto en el river?
¿Qué porcentaje aproximado da la regla del cuatro para 9 outs del flop viendo dos cartas?
¿Cuántas combinaciones sin orden de dos cartas hay entre 52 cartas distintas?
¿Cuántas combinaciones concretas de QQ hay sin bloqueadores?
¿Cuántas combinaciones de AKs hay sin bloqueadores? s significa del mismo palo.
¿Cuántas combinaciones de AKo hay sin bloqueadores? o significa de distinto palo.
Tienes A♠ 7♦; no se conocen otros ases. ¿Cuántas combinaciones de AA quedan?
Se conocen dos manos completas y tres cartas del flop, sin más cartas muertas. ¿Cuántos pares turn/river sin orden existen?
Bote 60, apuesta rival 20: P = 80 y coste adicional C = 20. Un bote, sin apuestas futuras: ¿qué porcentaje de equidad alcanza el equilibrio?
P = 80, C = 20, E = 25%; un bote elegible, sin comisión ni apuestas futuras. ¿EV de igualar frente a retirarse ahora?
P = 80, C = 20, E = 15%, sin apuestas futuras. ¿EV de igualar?
Farol puro: P0 = 100, B = 50, equidad cero si igualan, sin decisiones futuras. ¿Qué porcentaje de retiradas alcanza el equilibrio?
P0 = 100, B = 50, retirada supuesta F = 40%, equidad cero si igualan. ¿EV del farol?
100 resultados equiprobables: 30 victorias únicas, 20 empates de dos y 50 derrotas. ¿Equidad porcentual?
Antes de las ciegas, dos jugadores tienen 240 y 90 fichas. ¿Cuál es la pila efectiva?
Dos jugadores: asiento 1 botón/ciega pequeña, asiento 2 ciega grande. Ambos pueden actuar. ¿Quién actúa primero preflop?
Modelo: P = 80, C = 20, acierto 10%. Si aciertas, siempre ganas y recibes 100 adicionales del rival; si fallas, pierdes sin más pagos. ¿EV de igualar?
EV base +5 fichas. Aparte hay un 10% de perder 80 adicionales, todavía no incluido. ¿Nueva EV?
Tres jugadores aportan 30, 80 y 80 fichas. El primero está all-in. ¿Cuántas fichas hay en el bote principal que pueden ganar los tres?
Sin bloqueadores, un rango solo tiene AA con peso 100% y KK con 50%. ¿Qué porcentaje normalizado corresponde a AA?
9 objetivos de color y 8 de escalera; exactamente 2 están en ambos conjuntos. ¿Cuántos objetivos distintos hay?
`, `
Cuentan las cinco mejores entre siete. Puedes usar cero, una o dos cartas propias; no se evalúan siete como una mano.
Aquí el as está debajo del dos. Una escalera no puede dar la vuelta pasando por el as.
Tras K-K-A, decide el kicker Q frente a J. Compartir el as no implica empate.
Todos usan la misma escalera real. Ni el palo ni las cartas propias deshacen el empate; las fichas indivisibles siguen la regla de mesa.
Una carta objetivo no garantiza ganar. El rival también puede mejorar; importan mesas emparejadas o colores superiores.
El denominador es el número actual de cartas desconocidas. Acertar un objetivo no equivale automáticamente a ganar.
Resta de uno la probabilidad de fallar dos veces. Sumar la misma probabilidad dos veces ignora la retirada de cartas y duplica algunos resultados.
Es una aproximación declarada. La probabilidad exacta con objetivos fijos es distinta y requiere ver realmente dos cartas.
El orden de las mismas dos cartas no crea otra combinación. Las 169 casillas son clases, no manos concretas.
Se cuentan combinaciones concretas antes de bloqueadores. s incluye el mismo palo, o distintos palos; sin sufijo se incluyen ambos.
Elimina solo cartas conocidas y después normaliza pesos. Las cartas ocultas del simulador no son bloqueadores conocidos.
Los pares sin orden bastan para la equidad final al mostrar cartas; las decisiones por calle necesitan el orden.
Un bote, sin comisión ni apuestas futuras. El pago adicional entra en el bote final; no descuentes otra vez aportaciones pasadas. La suerte posterior no cambia el cálculo.
La frecuencia de retirada es un supuesto, no una propiedad demostrada del rival. El farol puro es positivo solo por encima del umbral.
Un empate de dos vale medio bote. Las frecuencias de victoria, empate y derrota son distintas de la equidad.
Contra un rival solo puede disputarse la menor pila disponible.
El botón/ciega pequeña actúa primero preflop y último después del flop. La posición no proporciona por sí sola una estrategia resuelta.
El pago extra depende de acertar y ganar. Un rival real puede no pagar; también hay que incluir costes propios futuros y outs sucios.
Resta la pérdida futura esperada una sola vez. La equidad bruta no predice ese pago supuesto.
Solo los jugadores elegibles pueden ganar cada bote. Los botes principal y lateral requieren equidades separadas.
Los pesos se aplican por combinación y se dividen por su suma. El peso de una casilla no es directamente su probabilidad.
Resta la intersección una vez para no duplicar cartas. Incluso objetivos distintos pueden no ser outs ganadores limpios.
`);
