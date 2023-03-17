export interface INetwork {
    name :string
    id :string;
    wss :string | Array<string>;
    db_id :number;
    routers: { [key: string]: string };
    common: { [key: string]: string };
    scan_api?: string;
    
}