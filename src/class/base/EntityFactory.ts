import { ERC20, ERC721, ERC1155, Pair, MasterChef } from '../entities';
import { IERC20, IERC721, IERC1155, IPair, UniqueID, IMasterChef } from '../shapes';
import { FormalEntity } from '../entities/index';

type IEntity = IERC20 | IERC721 | IERC1155 | IPair | IMasterChef;

export class EntityFactory {
    static issue(type: UniqueID, data: IEntity): FormalEntity {
        switch(type) {
            case 'ERC20':
                return new ERC20(data);
            case 'ERC721':
                return new ERC721(data);
            case 'ERC1155':
                return new ERC1155(data);
            case 'UniswapV2Pair':
                return new Pair(data);
            case 'MasterChef':
                return new MasterChef(data);
        }
    }
}