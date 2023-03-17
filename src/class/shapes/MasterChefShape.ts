
export interface IMasterChef {

    address: string;
    network_id: number;
    created_at: Date;

    id?: number;
    name?: string;
    length?: number;
    start?: number;
    owner?: string;
    verified?: boolean;
}

export class MasterChefShape {

    address: string;
    network_id: number;
    created_at: Date;

    id?: number;
    name?: string;
    length?: number;
    start?: number;
    owner?: string;
    verified?: boolean;

    constructor( params :IMasterChef){
        this.address = params.address;
        this.network_id = params.network_id;
        this.created_at = params.created_at;
        this.id = params.id;
        this.length = params.length;
        this.start = params.start;
        this.verified = params.verified;
    }
}