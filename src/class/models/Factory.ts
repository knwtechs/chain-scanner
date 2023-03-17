import * as mysql from 'mysql2/promise';
import { Database } from '../base';
import { AbiItem } from 'web3-utils';

export class Factory {

    static table: string = "factories";
    static ABI: AbiItem[] = require('../../abis/Factory.json') as AbiItem[];
    id :number;
    name :string;
    address: string
    created_at :Date;
    
    constructor({id, name, address, created_at} :{id: number, name: string, address: string, created_at: number}){
        this.id = id;
        this.name = name;
        this.address = address;
        this.created_at = new Date(created_at);
    }

    static async get(db :Database, address:string) :Promise<Factory | null> {
        try{
            let r :mysql.RowDataPacket[] | null = await db.query(`SELECT * from ${Factory.table} WHERE name="${address}" LIMIT 1`);
            if(r === null || r.length == 0) return null;
            return new Factory({
                id: r[0]['id'],
                name: r[0]['name'],
                address: r[0]['address'],
                created_at: r[0]['created_at']
            });
        }catch(err){
            console.log(err);
            return null;
        }
    }

    static async all(db: Database): Promise<Factory[]> {
        let r :mysql.RowDataPacket[] | null = await db.query(`SELECT * from ${Factory.table}`);
        if( r === null) return [];
        let f: Factory[] = [];
        for(let x of r)
            f.push(new Factory({
                id: x['id'],
                name: x['name'],
                address: x['address'],
                created_at: x['created_at']
            }));
        
        return f;
    }

}