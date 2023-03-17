import { BlockExplorer } from "../utils";
import { Database, Entity, FilterRulesItem, SafeWeb3 } from "../base";
import { AbiItem } from 'web3-utils'
import { ERC20Shape, IERC20, UniqueID } from '../shapes';
import { Resolvable } from '../../interfaces';
import { RowDataPacket } from 'mysql2/promise';

export class ERC20 extends Entity<ERC20Shape> implements Resolvable {
    
    static uid: UniqueID = "ERC20";
    static ABI: AbiItem[] = require('../../abis/erc20.json') as AbiItem[];
    static table: string = "tokens";
    static use_save: boolean = true;

    static filterRules: FilterRulesItem = {
        rule: 'name()',
        for: ERC20.uid,
        next: {
            rule: 'symbol()',
            for: ERC20.uid,
            next: {
                rule: 'decimals()',
                for: ERC20.uid,
                next: {
                    rule: 'totalSupply()',
                    for: ERC20.uid,
                    next: {
                        rule: 'balanceOf()',
                        for: ERC20.uid,
                    }
                }
            }
        }
    };
    
    constructor( params :IERC20) {
        super({
            shape: new ERC20Shape(params),
            abi: ERC20.ABI,
            required: ['id', 'network_id', 'created_at'],
            table: ERC20.table
        });
        this.shape = params;
    }

    get should_save() :boolean {
        if(ERC20.use_save)
            if(this.shape.totalSupply)
                return this.shape.totalSupply > 0;
        return false;
    }

    /* 
        Resolvable.resolve(source: any) :Promise<any>
    */
    async resolve(safe: SafeWeb3) :Promise<ERC20>{

        let result :ERC20Shape = new ERC20Shape(this.shape);
        if(safe.w3 === undefined) throw new Error("Resolve failed due an invalid instance of Web3 Provided.");

        try{
    
            var myContractInstance = new safe.w3.eth.Contract( this.abi, this.shape.address);

            try {
                result.circulatingSupply = await BlockExplorer.get_circulating_supply(safe.network, this.shape.address);
            }catch(e){}

            try {
                result.name = await myContractInstance.methods.name().call();
            }catch(e){}

            try {
                result.symbol = await myContractInstance.methods.symbol().call();
            }catch(e){}

            try {
                result.totalSupply = await myContractInstance.methods.totalSupply().call(); 
            }catch(e){}

            try {
                result.owner = await myContractInstance.methods.owner().call();
            }catch(e){}

            if( result.owner !== undefined){
                try {
                    result.ownerBalance = await BlockExplorer.get_owner_balance(safe.network, this.shape.address, result.owner);
                }catch(e){ }
            }else {}
            this.shape = result;
            return this;
        }catch(err){
            console.log(err);
            return this;
        }

    }

    static async get(db: Database, condition: string): Promise<ERC20 | null> {
        
        let r :RowDataPacket[] | null = await db.query(`SELECT * from ${this.table} WHERE ${condition} LIMIT 1`);
        if( r === null) return null;
        if(r.length == 0) return null;
        let x = r[0];
        return new ERC20({
            id: x['id'],
            network_id: x['network_id'],
            address: x['address'],
            name: x['name'],
            symbol: x['symbol'],
            totalSupply: x['totalSupply'],
            circulatingSupply: x['circulatingSupply'],
            owner: x['owner'],
            ownerBalance: x['ownerBalance'],
            score: x['score'],
            created_at: x['created_at']
        });        
    }

    async markAsSelected(db: Database): Promise<ERC20> {
        this.shape.score = 1;
        console.log(`Network ID: ${this.shape.network_id}`);
        await this.save(db);
        return this;
    }

    static ignore(): void {
        ERC20.use_save = false;    
    }
}
