import { Database, Entity, FilterRulesItem } from "../base";
import { AbiItem } from 'web3-utils'
import { Resolvable } from '../../interfaces';
import { MasterChefShape, IMasterChef, UniqueID } from '../shapes';
import { SafeWeb3 } from '../base/SafeWeb3';
import { RowDataPacket } from "mysql2/promise";
import { Pair } from ".";
import { BigNumber } from 'bignumber.js';
import { getPrice, Colors } from '../utils';


export class MasterChef extends Entity<MasterChefShape> implements Resolvable {
    
    static uid: UniqueID = "MasterChef";
    static ABI: AbiItem[] = require('../../abis/masterchef.json') as AbiItem[];
    static table: string = "masterchefs";
    static use_save: boolean = true;
    static filterRules: FilterRulesItem = {
        rule: 'poolLength()',
        for: MasterChef.uid,
        next: {
            rule: 'poolInfo()',
            for: MasterChef.uid,
            next: {
                rule: 'deposit()',
                for: MasterChef.uid,
                next: {
                    rule: 'withdraw()',
                    for: MasterChef.uid,
                    next: {
                        rule: 'startBlock()',
                        for: MasterChef.uid,
                        next: {
                            rule: 'canHarvest()',
                            for: MasterChef.uid,
                        }
                    }
                }
            }
        }
    };

    balances: {
        address: string,
        value: number,
        amount: number
    }[];
    
    constructor( params :IMasterChef) {
        super({
            shape: new MasterChefShape(params),
            abi: MasterChef.ABI,
            required: ['id', 'network_id', 'created_at'],
            table: MasterChef.table
        });
        this.shape = params;
        this.balances = [];
    }

    get should_save() :boolean {
        return MasterChef.use_save;
    }

    /* 
        Resolvable.resolve(source: any) :Promise<any>
    */
    async resolve(safe: SafeWeb3) :Promise<MasterChef>{

        let result :MasterChefShape = new MasterChefShape(this.shape);
        if(safe.w3 === undefined) throw new Error("Resolve failed due an invalid instance of Web3 Provided.");

        try{
    
            var myContractInstance = new safe.w3.eth.Contract( this.abi, this.shape.address);

            try {
                result.length = await myContractInstance.methods.poolLength().call();
            }catch(e){}

            try {
                result.start = await myContractInstance.methods.startBlock().call();
            }catch(e){}

            try {
                result.owner = await myContractInstance.methods.owner().call();
            }catch(e){}

            return this;
        }catch(err){
            console.log(err);
            return this;
        }

    }

    static async all(db: Database): Promise<MasterChef[]> {
        let r :RowDataPacket[] | null = await db.query(`SELECT * from masterchefs`);
        if( r === null) return [];
        let f: MasterChef[] = [];
        for(let x of r)
            f.push(new MasterChef({
                id: x['id'],
                name: x['name'],
                address: x['address'],
                created_at: x['created_at'],
                network_id: x['network_id'],
                length: x['length'],
                start: x['start'],
                owner: x['owner'],
                verified: x['verified']
            }));
        
        return f;
    }

    static async get(db: Database, condition: string): Promise<MasterChef | null> {
        
        let r :RowDataPacket[] | null = await db.query(`SELECT * from ${this.table} WHERE ${condition} LIMIT 1`);
        if( r === null) return null;
        if(r.length == 0) return null;
        let x = r[0];
        return new MasterChef({
            id: x['id'],
            network_id: x['network_id'],
            address: x['address'],
            name: x['name'],
            owner: x['owner'],
            created_at: x['created_at'],
            verified: x['verified'],
            length: x['length'],
            start: x['start']
        });        
    }

    async markAsVerified(db: Database): Promise<void> {
        this.shape.verified = true;
        this.save(db);
    }

    async getPairs(safe: SafeWeb3): Promise<Pair[]> {
        
        if(safe.w3 === undefined) throw new Error('[MASTERCHEF] SafeWeb3 down.');
        try{
            let pools :Pair[] = [];
            let contract = new (safe.w3.eth).Contract( this.abi, this.shape.address);
            let len: number = await contract.methods.poolLength().call();

            for(let i=0;i<len;i++){
                let pool_info = await contract.methods.poolInfo(i).call();
                pools.push(new Pair({
                    address: pool_info[0],
                    network_id: safe.network.db_id,
                    created_at: new Date()
                }));
            }
            return pools;
        }catch(err){
            console.log(`${Colors.RED}[MASTERCHEF] getPairs(): ${err} ${Colors.RESET}`);
            return [];
        }
    }

    async tvl({safe, router}: {safe: SafeWeb3, router: string}): Promise<number> {

        if(!safe.w3) throw new Error('[MASTERCHEF] SafeWeb3 Down.');

        const pairs = await this.getPairs(safe);
        let total_value_locked = 0;

        for(let p of pairs){

            const pair_contract = new safe.w3.eth.Contract(Pair.ABI, p.shape.address);
            const pair_decimals = Number(await pair_contract.methods.decimals().call());
            let mc_pair_balance: number;
            let mc_pair_balance_bn: BigNumber = new BigNumber(await pair_contract.methods.balanceOf(this.shape.address).call());
            mc_pair_balance = mc_pair_balance_bn.shiftedBy(-1*pair_decimals).toNumber();
            
            //console.log(`${p.shape.address} balance: ${mc_pair_balance}`);
            try{
                let _tvl = 0;
                let resolved: Pair;
                let processed: boolean = false;
                const pairObj = await p.filter(safe);

                if(pairObj){
                    resolved = await pairObj.resolve(safe);
                    if(resolved.shape.token0 && resolved.shape.token1){
                        let pair_price = await resolved.getPrice(safe, router);
                        _tvl = (pair_price * mc_pair_balance);
                        processed = true;
                    }
                }
                
                if(!processed){
                    if(p.shape.address.toLowerCase() !== safe.network.common["USDC"].toLowerCase()){
                        let path: string[] = [ p.shape.address ];
                        if(p.shape.address.toLowerCase() !== safe.network.common["WMATIC"].toLowerCase())
                            path.push(safe.network.common["WMATIC"]);
                        
                        path.push(safe.network.common["USDC"]);
                        let price = await getPrice({ w3: safe.w3, router_address: router, path: path});
                        //console.log(`${p.shape.address} price: ${price}`);
                        _tvl = price * mc_pair_balance;
                    }else{ 
                        _tvl = mc_pair_balance;
                    }
                }

                total_value_locked += _tvl;
                this.balances.push({
                    address: p.shape.address,
                    amount: mc_pair_balance,
                    value: _tvl
                });

            }catch(err){
                console.log(`${Colors.RED}[MASTERCHEF] Cannot calc tvl: ${err}${Colors.RESET}`);
            }

        }

        return total_value_locked;
    }

    async tvlHistory(db: Database): Promise<RowDataPacket[] | []> {
        let q = db.f(`SELECT tvl FROM masterchefs_tvl WHERE address=?`, [this.shape.address]);
        let r = await db.query(q);
        if(r === null) return [];
        return r;
    }

    async updateTvl({safe, router, db}: {safe: SafeWeb3, router: string, db: Database}): Promise<boolean> {
        try{
            let tvl = await this.tvl({safe, router});
            let q = db.f(`INSERT IGNORE INTO masterchefs_tvl (address, tvl, created_at) VALUES (?,?,?)`, [this.shape.address, tvl, new Date()]);
            let r = await db.query(q);
            return r !== null;
        }catch(err){
            console.log(`${Colors.RED}[MC] updateTvl(): ${err}${Colors.RESET}`);
            return false;
        }
    }

    static ignore(): void {
        MasterChef.use_save = false;    
    }
}
