import {writeFileSync} from 'node:fs';
import {shuffledDeck,seededRandom,cardText,parseCards} from '../src/cards';
import {fromEquityRequest} from '../src/engines/contract';
import type {EquityRequest} from '../src/equity';
const random=seededRandom(0x504f4b31),fixtures=[];
for(let i=0;i<120;i++){
  const players=2+i%5,street=[0,3,4,5][Math.floor(i/5)%4],deck=shuffledDeck(random),hole=deck.slice(0,2*players),board=deck.slice(2*players,2*players+street);
  const request:EquityRequest={hero:hole.slice(0,2),board,opponents:Array.from({length:players-1},(_,p)=>({hand:hole.slice(2+p*2,4+p*2)})),method:'exact',seed:1000+i};
  // Preflop exact cases disclose enough explicit dead cards to leave eight unknown cards (56 boards).
  if(street===0)request.dead=deck.slice(2*players+8);
  if(i%7===0&&street===5){request.opponents[0]={range:[{cards:request.opponents[0].hand! as [number,number],weight:1},{cards:deck.slice(2*players+5,2*players+7) as [number,number],weight:.25}]};}
  const canonical=fromEquityRequest(request,'pok-standard',0);canonical.requestId=`fixture-${i.toString().padStart(3,'0')}`;
  fixtures.push({id:canonical.requestId,description:`${players} players; board ${street}; ${request.dead?'explicit study dead cards':'ordinary known information'}`,request:canonical});
}
const cases=[
  {id:'royal-three-way',hero:'2c3c',board:'TsJsQsKsAs',hands:['4c5c','6c7c']},
  {id:'documented-990',hero:'AsAh',board:'2c7dJh',hands:['KsKh']},
  {id:'wheel-kickers',hero:'As2c',board:'3d4h5s9cKd',hands:['Ac2d']},
];
for(const c of cases){const r=fromEquityRequest({hero:parseCards(c.hero),board:parseCards(c.board),opponents:c.hands.map(h=>({hand:parseCards(h)})),method:'exact'},'pok-standard',0);r.requestId=c.id;fixtures.push({id:c.id,description:c.id,request:r})}
writeFileSync('tests/fixtures/engine-equity-v1.json',JSON.stringify({schemaVersion:1,generatorSeed:0x504f4b31,fixtures},null,2)+'\n');
console.log(`${fixtures.length} deterministic fixtures written; card notation ${cardText(0)}..${cardText(51)}`);
