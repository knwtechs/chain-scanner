
export interface IERC20 {
    id?: number;
    address: string;
    network_id: number;
    created_at: Date;
    name?: string;
    symbol?: string;
    totalSupply?: number;
    circulatingSupply?: number;
    owner?: string;
    ownerBalance?: number;
    score?: number;
};

export class ERC20Shape {

    address: string;
    network_id: number;
    created_at: Date;

    id?: number;
    name?: string;
    symbol?: string;
    totalSupply?: number;
    circulatingSupply?: number;
    owner?: string;
    ownerBalance?: number;
    score?: number;

    constructor(params: IERC20){
        this.id = params.id;
        this.address = params.address;
        this.network_id = params.network_id;
        this.created_at = params.created_at;
        this.name = params.name;
        this.symbol = params.symbol;
        this.totalSupply = params.totalSupply;
        this.circulatingSupply = params.circulatingSupply;
        this.owner = params.owner;
        this.ownerBalance = params.ownerBalance;
        this.score = params.score;
    }
}