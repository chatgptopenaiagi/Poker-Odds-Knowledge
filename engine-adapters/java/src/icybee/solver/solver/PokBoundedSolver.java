package icybee.solver.solver;

import icybee.solver.*;
import icybee.solver.compairer.Compairer;
import icybee.solver.ranges.PrivateCards;
import icybee.solver.trainable.DiscountedCfrTrainable;
import java.util.*;
import java.util.concurrent.ForkJoinPool;
import java.util.function.Consumer;

/** Runs the actual upstream CFR traversal/discounted regret updates; supplies bounded lifecycle only. */
public final class PokBoundedSolver extends CfrPlusRiverSolver {
 public int completed=0;
 public PokBoundedSolver(GameTree tree,PrivateCards[]a,PrivateCards[]b,int[]board,Compairer eval,Deck deck,int iterations){super(tree,a,b,board,eval,deck,iterations,false,Integer.MAX_VALUE,null,DiscountedCfrTrainable.class,MonteCarolAlg.NONE);forkJoinPool.shutdownNow();forkJoinPool=new ForkJoinPool(1);}
 public void solve(long deadline,Consumer<Map<String,Object>> progress)throws Exception {
  try{setTrainable(tree.getRoot());float[][] reach=getReachProbs();for(int i=0;i<iteration_number;i++){if(System.nanoTime()>deadline)throw new IllegalStateException("deadline_exceeded");for(int player=0;player<2;player++){round_deal=new int[]{-1,-1,-1,-1};cfr(player,tree.getRoot(),reach,i,initial_board_long);}completed=i+1;if(completed==1||completed%500==0||completed==iteration_number){double[]br=bestResponseValues();progress.accept(Map.of("type","progress","iterations",completed,"target",iteration_number,"bestResponseValues",br,"gap",br[0]+br[1],"nashConvChips",br[0]+br[1]));}}}finally{forkJoinPool.shutdownNow();}
 }
 public double[] bestResponseValues()throws Exception {BestResponse br=new BestResponse(ranges,2,compairer,pcm,rrm,deck,false);float[][] reach=getReachProbs();return new double[]{br.getBestReponseEv(tree.getRoot(),0,reach,initial_board_long),br.getBestReponseEv(tree.getRoot(),1,reach,initial_board_long)};}
}
