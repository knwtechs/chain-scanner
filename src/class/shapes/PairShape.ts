
export interface IPair {
    id?: number;
    address: string;
    network_id: number;
    created_at: Date;
    name?: string;
    symbol?: string;
    token0?: string;
    token1?: string;
    reserve0?: number;
    reserve1?: number;
    factory?: string;
    totalSupply?: number;
}

export class PairShape {

    address: string;
    network_id: number;
    created_at: Date;

    id?: number;
    name?: string;
    symbol?: string;
    token0?: string;
    token1?: string ;
    reserve0?: number;
    reserve1?: number;
    factory?: string;
    totalSupply?: number;

    constructor( params :IPair){
        this.address = params.address;
        this.network_id = params.network_id;
        this.created_at = params.created_at;
        this.id = params.id;
        this.name = params.name;
        this.symbol = params.symbol;
        this.token0 = params.token0;
        this.token1 = params.token1;
        this.reserve0 = params.reserve0;
        this.reserve1 = params.reserve1;
        this.factory = params.factory;
        this.totalSupply = params.totalSupply;
    }
}