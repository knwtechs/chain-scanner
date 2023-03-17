
export interface IERC721 {

    id?: number;
    address: string;
    network_id: number;

    created_at: Date;
    name?: string;
    symbol?: string;
    baseURI?: string;
    score?: number;
};

export class ERC721Shape {

    address: string;
    network_id: number;
    created_at: Date;

    id?: number;
    name?: string;
    symbol?: string;
    baseURI?: string;
    score?: number;

    constructor(params: IERC721){
        
        this.id = params.id;
        this.address = params.address;
        this.network_id = params.network_id;

        this.created_at = params.created_at;
        this.name = params.name;
        this.symbol = params.symbol;
        this.baseURI = params.baseURI;
        this.score = params.score;
    }
}