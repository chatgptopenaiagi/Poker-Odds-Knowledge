package pok.solver;

import icybee.solver.Card;
import icybee.solver.compairer.Compairer;
import java.util.*;

/** POK reference five-card evaluator port plus independent best-of-21 enumeration.
 * Not upstream's dictionary evaluator. The solver requires smaller-is-stronger ranks. */
public final class ReferenceCompairer extends Compairer {
 private final Map<Long,Integer> cache=new HashMap<>();
 public ReferenceCompairer() throws java.io.FileNotFoundException {super(null,0);}
 public CompairResult compair(List<Card>a,List<Card>b,List<Card>board){return result(get_rank(a,board),get_rank(b,board));}
 public CompairResult compair(int[]a,int[]b,int[]board){return result(get_rank(a,board),get_rank(b,board));}
 private CompairResult result(int a,int b){return a==b?CompairResult.EQUAL:a<b?CompairResult.LARGER:CompairResult.SMALLER;}
 public int get_rank(List<Card>hand,List<Card>board){return get_rank(hand.stream().mapToInt(Card::card2int).toArray(),board.stream().mapToInt(Card::card2int).toArray());}
 public int get_rank(long hand,long board){return get_rank(Card.long2board(hand),Card.long2board(board));}
 public int get_rank(int[]hand,int[]board){long key=Card.boardInts2long(hand)|Card.boardInts2long(board);return cache.computeIfAbsent(key,k->{int[] all=Card.long2board(k);return -evaluate(all);});}
 public static int evaluate(int[] cards){if(cards.length<5||cards.length>7)throw new IllegalArgumentException("invalid_evaluation_cards");long seen=0;for(int c:cards){if(c<0||c>51||(seen&(1L<<c))!=0)throw new IllegalArgumentException("duplicate_or_invalid_card");seen|=1L<<c;}int best=-1;for(int a=0;a<cards.length-4;a++)for(int b=a+1;b<cards.length-3;b++)for(int c=b+1;c<cards.length-2;c++)for(int d=c+1;d<cards.length-1;d++)for(int e=d+1;e<cards.length;e++)best=Math.max(best,five(new int[]{cards[a],cards[b],cards[c],cards[d],cards[e]}));return best;}
 private static int five(int[]cards){int[] counts=new int[15];boolean flush=true;for(int c:cards){counts[c/4+2]++;flush&=c%4==cards[0]%4;}List<Integer> unique=new ArrayList<>(),groups=new ArrayList<>();for(int r=14;r>=2;r--)if(counts[r]>0){unique.add(r);groups.add(r);}groups.sort((a,b)->counts[a]!=counts[b]?counts[b]-counts[a]:b-a);int high=unique.size()==5&&unique.get(0)-unique.get(4)==4?unique.get(0):unique.equals(Arrays.asList(14,5,4,3,2))?5:0;int category;List<Integer> order=new ArrayList<>();if(flush&&high>0){category=8;order.add(high);}else if(counts[groups.get(0)]==4){category=7;order=groups;}else if(counts[groups.get(0)]==3&&counts[groups.get(1)]==2){category=6;order=groups;}else if(flush){category=5;order=unique;}else if(high>0){category=4;order.add(high);}else if(counts[groups.get(0)]==3){category=3;order=groups;}else if(counts[groups.get(0)]==2&&counts[groups.get(1)]==2){category=2;order=groups;}else if(counts[groups.get(0)]==2){category=1;order=groups;}else{category=0;order=unique;}int score=category;for(int i=0;i<5;i++)score=score*15+(i<order.size()?order.get(i):0);return score;}
}
