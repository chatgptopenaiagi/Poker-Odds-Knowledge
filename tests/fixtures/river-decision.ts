import {createHand,act} from '../../src/game';
import {parseCards} from '../../src/cards';
export function weightedRiverFixture(){
 const prefix=parseCards('9d Ac 9h Ad 4c 2c 3d 7h 5c 8s 6c 9c');
 let h=createHand({id:'weighted-river-fixture',seats:2,button:0,deck:[...prefix,...Array.from({length:52},(_,i)=>i).filter(c=>!prefix.includes(c))]});
 h=act(h,{type:'call'});for(let i=0;i<5;i++)h=act(h,{type:'check'});return act(h,{type:'raise',to:20});
}
