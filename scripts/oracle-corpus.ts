import { writeFileSync } from 'node:fs';
import { cardText, parseCards, seededRandom, shuffledDeck } from '../src/cards';
import { evaluate, handCategory } from '../src/evaluator';
const rng = seededRandom(417031);
const hands = ['AsAhAdKsKhKd2c', 'As2d3c4h5s9hTc', 'AsKsQsJsTs2c3d', 'AsAhKsKhQsQh2c'].map(parseCards);
for (let i = 0; i < 5000; i++) hands.push(shuffledDeck(rng).slice(0, 5 + i % 3));
const corpus = hands.map(cards => ({ cards: cards.map(cardText).join(''), score: evaluate(cards), category: handCategory(evaluate(cards)) }));
writeFileSync('artifacts/evaluator-corpus.json', JSON.stringify({ version: 1, seed: 417031, hands: corpus }, null, 2) + '\n');
console.log(JSON.stringify({ hands: corpus.length, output: 'artifacts/evaluator-corpus.json' }));
