import { Database, Entity, FilterRulesItem, SafeWeb3 } from "../base";
import { AbiItem } from 'web3-utils'
import { ERC721Shape, IERC721, UniqueID } from '../shapes';
import { Resolvable } from '../../interfaces';
import { RowDataPacket } from 'mysql2/promise';

export class ERC721 extends Entity<ERC721Shape> implements Resolvable {
    
    static uid: UniqueID = "ERC721";
    static ABI: AbiItem[] = require('../../abis/erc721.json') as AbiItem[];
    static table: string = "erc721";
    static use_save = true;

    static filterRules: FilterRulesItem = {
        rule: 'symbol()',
        for: ERC721.uid,
        next: {
            rule: 'name()',
            for: ERC721.uid,
            next: {
                rule: 'supportsInterface()',
                for: ERC721.uid,
                next: {
                    rule: 'tokenURI()',
                    for: ERC721.uid
                }
            }
        }
    };
    
    constructor( params :IERC721) {
        super({
            shape: new ERC721Shape(params),
            abi: ERC721.ABI,
            required: ['id', 'network_id', 'created_at'],
            table: ERC721.table
        });
        this.shape = params;
    }

    get should_save() :boolean {
        return ERC721.use_save;
    }

    /* 
        Resolvable.resolve(source: any) :Promise<any>
    */
    async resolve(safe: SafeWeb3) :Promise<ERC721>{

        let result :ERC721Shape = new ERC721Shape(this.shape);
        if(safe.w3 === undefined) throw new Error("Resolve failed due an invalid instance of Web3 Provided.");

        try{
    
            var myContractInstance = new safe.w3.eth.Contract( this.abi, this.shape.address);

            try {
                result.symbol = await myContractInstance.methods.symbol().call();
            }catch(e){
                console.log("[ERR] Resolving symbol for %s", result.address);
            }

            try {
                result.name = await myContractInstance.methods.name().call();
            }catch(e){
                console.log("[ERR] Resolving name for %s", result.address);
            }

            this.shape = result;
            return this;

        }catch(err){
            console.log("[ERR] Resolving %s: %s", result.address, err);
            return this;
        }

    }

    static async get(db: Database, condition: string): Promise<ERC721 | null> {
        
        let r :RowDataPacket[] | null = await db.query(`SELECT * from ${this.table} WHERE ${condition} LIMIT 1`);
        if( r === null) return null;
        if(r.length == 0) return null;
        let x = r[0];
        return new ERC721(Object.assign({}, x) as IERC721);        
    }

    async markAsSelected(db: Database): Promise<ERC721> {
        this.shape.score = 1;
        console.log(`Network ID: ${this.shape.network_id}`);
        await this.save(db);
        return this;
    }

    static ignore(): void {
        ERC721.use_save = false;    
    }
}
