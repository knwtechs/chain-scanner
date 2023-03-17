import { PairShape } from './PairShape';
import { ERC20Shape } from './ERC20Shape';
import { MasterChefShape } from './MasterChefShape';

export type UniqueID = "ERC20" | "UniswapV2Pair" | "MasterChef" | "ERC721" | "ERC1155";
export type Shape = ERC20Shape | MasterChefShape | PairShape;