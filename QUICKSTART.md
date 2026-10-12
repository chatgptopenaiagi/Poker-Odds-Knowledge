# Your first five minutes in HIL

1. Open **http://localhost/holdem-lab/**. The first-run guide introduces play, pot odds and backups. Press **Start hand**. You sit at the bottom; local opponents take the other seats. Your cards are visible, theirs stay hidden until showdown. The gold border marks whose turn it is.
2. When **Your decision** appears, choose a legal **Check**, **Call**, **Fold**, **Raise** or **All-in**. Raise sizes mean **TO the total contribution on this street**. The line below shows the raise BY and additional chips. Buttons disable while saving. **Pause** stops before the next bot action; **Step** runs one bot decision while paused.
3. Press **Reveal calculation** in the decision notebook. If the pot before your call is 80 and the extra call is 20, the terminal single-pot threshold is `20 / (80 + 20) = 20%`. This is not automatically the best multistreet action. **Estimate equity** uses assumed opponent ranges; **Edit ranges** opens the Odds Lab. Teaching reveal is prominently labelled and does not give bots extra information.
4. Open **Drills**, select **Guess first**, and choose **The price of this call** (or any drill). Enter your numeric answer, then **Check answer**. The worked explanation includes the assumptions. **Next drill** advances; **Replay** clears your answer and repeats the same versioned exercise. Calculation accuracy is tracked separately from chips won.
5. After a hand ends, choose **Hand Review**. Select a saved hand and use **Replay**, the slider or next-action arrow. Clicking an action in the timeline shows the state **before** that action. A review branch uses only cards known at that point. **Branch to Odds Lab** edits probability assumptions; **Play an alternate branch** forks the simulation and preserves the original hand.
6. In **Settings**, press **Back up progress** to download a JSON file. Keep it somewhere you control. **Import backup** validates the file and asks before replacing the notebook. **Reset progress** also asks for confirmation and offers export first. Browser cleanup/private browsing can erase local records.

## Odds Lab

Enter cards as `As Kh` (ace of spades, king of hearts), `Td` (ten of diamonds), or suit symbols. The board has 0, 3, 4 or 5 cards. Unseen simulator burns/future/folded cards are not known dead cards. Add dead cards only when the study explicitly knows them.

Opponent examples: `Kc Kh`, `AA`, `AKs`, `AKo`, `77+`, `AJs+`, `AA:50%`, or `random`. Presets are educational assumptions. Choose an opponent, set a weight, and click a starting-hand cell; click again at the same weight to clear it. Pair cells expand to 6 combinations, suited nonpairs to 4, offsuit to 12 before blockers. Editing another cell preserves explicitly selected concrete hands.

**Calculate equity** reports exact enumeration or Monte Carlo, completed outcomes, inputs, seed, engine version, conditional assumptions and limits. Ties contribute fractional shares. A fixed-hand flop without extra dead cards enumerates 990 turn/river pairs. Larger problems use the selected sample budget, with a conservative fixed-N interval. **Stop calculation** cancels immediately. Change any input to discard the previous result. **Save scenario** bookmarks a validated copy below the lab.

## Settings and Romanian

Choose 2–6 seats, integer stack/blinds and animation speed, then **Apply settings**. Stack/blind changes apply to a new training session; completed hands/drills remain saved. A busted human seat prompts a fresh training session. **Reduced motion** removes transitions and thinking delays; pause/step remains available.

Use the top-right **RO · Română** control for Romanian core controls and every beginner lesson. The glossary gives consistent poker terms. Method names, technical metadata and some advanced labels remain English, disclosed in Settings. Select **Advanced view** to expand range-method detail.

If the page does not open, use the existing XAMPP Control Panel to check Apache. Do not start a second server, change listeners or stop unrelated software. The launcher provides the verified URL and this guidance. HIL needs no internet after the built files are deployed; Apache must still serve the local files.
