import { Database, Entity, FilterRulesItem, SafeWeb3 } from "../base";
import { AbiItem } from 'web3-utils'
import { ERC1155Shape, IERC1155, UniqueID } from '../shapes';
import { Resolvable } from '../../interfaces';
import { RowDataPacket } from 'mysql2/promise';

export class ERC1155 extends Entity<ERC1155Shape> implements Resolvable {
    
    static uid: UniqueID = "ERC1155";
    static ABI: AbiItem[] = require('../../abis/erc1155.json') as AbiItem[];
    static table: string = "erc1155";
    static use_save = true;

    static filterRules: FilterRulesItem = {
        rule: 'uri()',
        for: ERC1155.uid,
        next: {
            rule: 'supportsInterface()',
            for: ERC1155.uid,
            next: {
                rule: 'balanceOfBatch()',
                for: ERC1155.uid
            }
        }
    };
    
    constructor( params :IERC1155) {
        super({
            shape: new ERC1155Shape(params),
            abi: ERC1155.ABI,
            required: ['id', 'network_id', 'created_at'],
            table: ERC1155.table
        });
        this.shape = params;
    }

    get should_save() :boolean {
        return ERC1155.use_save;
    }

    /* 
        Resolvable.resolve(source: any) :Promise<any>
    */
    async resolve(safe: SafeWeb3) :Promise<ERC1155>{

        let result :ERC1155Shape = new ERC1155Shape(this.shape);
        if(safe.w3 === undefined) throw new Error("Resolve failed due an invalid instance of Web3 Provided.");

        try{
    
            var myContractInstance = new safe.w3.eth.Contract( this.abi, this.shape.address);

            try {
                result.uri = await myContractInstance.methods.uri().call()
            }catch(e){}

            this.shape = result;
            return this;
        }catch(err){
            console.log(err);
            return this;
        }

    }

    static async get(db: Database, condition: string): Promise<ERC1155 | null> {
        
        let r :RowDataPacket[] | null = await db.query(`SELECT * from ${this.table} WHERE ${condition} LIMIT 1`);
        if( r === null) return null;
        if(r.length == 0) return null;
        let x = r[0];
        return new ERC1155(Object.assign({}, x) as IERC1155);        
    }

    async markAsSelected(db: Database): Promise<ERC1155> {
        this.shape.score = 1;
        console.log(`Network ID: ${this.shape.network_id}`);
        await this.save(db);
        return this;
    }

    static ignore(): void {
        ERC1155.use_save = false;    
    }
}
