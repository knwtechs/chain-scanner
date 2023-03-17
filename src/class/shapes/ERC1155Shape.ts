
export interface IERC1155 {
    address: string;
    network_id: number;
    created_at: Date;

    id?: number;
    uri?: string;
    score?: number;
};

export class ERC1155Shape {

    address: string;
    network_id: number;
    created_at: Date;

    id?: number;
    uri?: string;
    score?: number;

    constructor(params: IERC1155){
        this.address = params.address;
        this.network_id = params.network_id;
        this.created_at = params.created_at;

        this.id = params.id;
        this.uri = params.uri;
        this.score = params.score;
    }
}