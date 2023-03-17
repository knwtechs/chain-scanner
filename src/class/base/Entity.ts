import { Database } from './Database';
import { AbiItem } from 'web3-utils';
import { Shape } from '../shapes';
import { FilterRulesItem } from './ContractFilter';

export abstract class Entity<T extends Shape> {

    shape: T;
    abi: AbiItem[];
    fields: Array<keyof T>;
    required: Array<keyof T>;
    table: string;
    static filterRules: FilterRulesItem;
    
    abstract get should_save() :boolean;

    constructor( {shape, abi, required, table} : { shape: T; abi: AbiItem[], required: Array<keyof T>, table: string}){
        this.shape = shape;
        this.fields = Object.getOwnPropertyNames(shape) as (keyof typeof shape)[];
        this.abi = abi;
        this.required = required;
        this.table = table;
    }
    
    get id() :any{ return this.shape.id; }

    setTable(name: string) { this.table = name; }

    async create(db: Database) :Promise<number|null> {

        if(!this.should_save) return null;

        let data: Array<any> = Array<any>();
        let holders: Array<"?"> = new Array<"?">();
        let names: Array<string> = Array<string>();
        
        this.fields.forEach( f => {
            if(f != "id" && this.shape[f]){
                data.push(this.shape[f]);
                names.push(f.toString());
                holders.push("?");
            }
        });

        let marks: string = "(" + holders.join(", ") + ")";
        let q :string = db.f("INSERT IGNORE INTO " + this.table + "(" + names.join(", ") + ") VALUES " + marks, data);
        let result: number | null =  await db.insert(q);
        if(result != null)
            this.shape.id = result;
        return result;
    }

    async save(db: Database) :Promise<void> {

        if(!this.shape.id)
            throw new Error("You must create an Entity before to save it.");

        let data :Array<any> = Array<any>();
        let fields :string = this.fields.map( f => {
            if(f != "id"){
                data.push(this.shape[f])
                return f.toString().concat(" = ?");
            }
        }).filter( attr => { return attr !== undefined }).join(", ");
        data.push(this.id);
        let q :string = db.f("UPDATE IGNORE " + this.table + " SET " + fields + " WHERE id=?", data);
        await db.query(q);
    }

    static async count(db: Database, table: string, just_24hours: boolean = false) :Promise<number> {
        let q: string = db.f("SELECT count(*) as total FROM " + table);
        if(just_24hours)
            q = db.f("SELECT count(*) as total FROM " + table + " WHERE created_at >= now() - INTERVAL 1 DAY");
        let r = await db.query(q).catch(e => console.log("[DB] %s: %s", q, e));
        if(!r) return 0;
        return r[0]['total'];
    }

}