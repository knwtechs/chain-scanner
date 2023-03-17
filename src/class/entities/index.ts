import { ERC20 } from './ERC20';
import { Pair } from './Pair';
import { MasterChef } from './MasterChef';
import { ERC1155 } from './ERC1155';
import { ERC721 } from './ERC721';

export { ERC20, ERC721, ERC1155, MasterChef, Pair}
export type FormalEntity = ERC20 | ERC721 | ERC1155 | Pair | MasterChef;
