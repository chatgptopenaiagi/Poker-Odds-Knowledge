import {describe,it,expect} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Card,Cards} from '../src/components';
import {CARD_DESIGNS,defaultAppearance,validateAppearance} from '../src/appearance';
import {cardText} from '../src/cards';
it('graphical ten renders 10 while card identity remains Ts',()=>{
 const html=renderToStaticMarkup(createElement(Card,{card:35}));
 expect(html).toContain('>10</b>');expect(html).not.toContain('>T</b>');expect(cardText(35)).toBe('Ts');
});
describe.each(CARD_DESIGNS)('%s faces',design=>{
 for(const colors of ['two','four'] as const)it(`renders every unique identity in ${colors} colors and bilingual names`,()=>{
  const labels=new Set<string>();
  for(let card=0;card<52;card++){
   const html=renderToStaticMarkup(createElement(Card,{card,design,colors}));
   const rank=cardText(card)[0].replace('T','10');
   expect(html).toContain(`>${rank}</b>`);expect(html).toContain(`>${['♣','♦','♥','♠'][card%4]}</span>`);
   labels.add(html.match(/aria-label="([^"]+)"/)![1]);
   const ro=renderToStaticMarkup(createElement(Card,{card,design,colors,locale:'ro'}));expect(ro).toContain(` de ${['treflă','caro','cupă','pică'][card%4]}`);
  }expect(labels.size).toBe(52);
 });
 it('hidden faces contain no rank, suit, identity attribute or text',()=>{
  const a=renderToStaticMarkup(createElement(Cards,{cards:[35,51],hidden:true}));
  const b=renderToStaticMarkup(createElement(Cards,{cards:[0,1],hidden:true}));
  expect(a).toBe(b);expect(a).not.toMatch(/♣|♦|♥|♠|data-card|Ts|As/);
  expect(renderToStaticMarkup(createElement(Card,{design,locale:'ro'}))).toContain('Carte ascunsă');
  expect(renderToStaticMarkup(createElement(Card,{empty:true}))).toContain('Empty card slot');
 });
});
it('migrates old preferences without changing other display choices and rejects unknown style IDs',()=>{
 const {cardDesign,suitColors,...legacy}=defaultAppearance;
 expect(validateAppearance({...legacy,cardScale:140,palette:'rose'})).toEqual({...defaultAppearance,cardScale:140,palette:'rose'});
 expect(validateAppearance({...legacy,cardDesign:'<script>',suitColors:'rainbow'})).toEqual(defaultAppearance);
 for(const cardDesign of CARD_DESIGNS)expect(validateAppearance({...defaultAppearance,cardDesign,suitColors:'four'})).toEqual({...defaultAppearance,cardDesign,suitColors:'four'});
});
