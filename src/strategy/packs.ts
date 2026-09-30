import catalog from '../../public/strategy/packs.json';
import type {SolutionPack} from './contract';
// Populated only from actual solver runs that pass the independent oracle gate.
export const bundledPacks=catalog as SolutionPack[];
