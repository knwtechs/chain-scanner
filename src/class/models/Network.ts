import { INetwork } from '../../interfaces';

export class Network {

    id :string;
    name :string;
    wss: string | Array<string>;
    scan_api?: string;
    db_id :number;
    common: { [key: string]: string };
    routers: { [key: string]: string };
    
    constructor(params :INetwork){
        this.id = params.id;
        this.wss = params.wss;
        this.db_id = params.db_id;
        this.name = params.name;
        this.scan_api = params.scan_api;
        this.routers = params.routers;
        this.common = params.common;
    }

    /*static async get(db :Database, name:string) :Promise<Network | null> {
        let r :mysql.RowDataPacket[] | null = await db.query("SELECT * from networks WHERE name=" + name + " LIMIT 1;");
        if(r === null) return null;
        return new Network({
            id: r[0]['id'],
            wss: r[0]['wss'],
            db_id: r[0]['db_id'],
            name: r[0]['name']
        });
    }*/

}