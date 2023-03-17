import { AbiItem } from 'web3-utils'
import { Database, Entity, FilterRulesItem, SafeWeb3 } from "../base";
import { PairShape, IPair, UniqueID } from "../shapes";
import { Resolvable, Filterable } from '../../interfaces';
import { RowDataPacket } from 'mysql2/promise';
import { ERC20 } from '.';
import { ContractFilter } from '../base/ContractFilter';
import { BigNumber } from 'bignumber.js';
import { Colors, getPrice } from '../utils';

export class Pair extends Entity<PairShape> implements Resolvable {

    static ABI: AbiItem[] = require('../../abis/pair.json') as AbiItem[];
    static uid: UniqueID = 'UniswapV2Pair';
    static table: string = "pairs";
    static use_save: boolean = true;
    static filterRules: FilterRulesItem = {
        rule: 'factory()',
        for:  Pair.uid,
        next: {
            rule: 'MINIMUM_LIQUIDITY()',
            for: Pair.uid,
            next: {
                rule: 'token0()',
                for: Pair.uid,
                next: {
                    rule: 'token1()',
                    for: Pair.uid,
                    next: {
                        rule: 'getReserves()',
                        for: Pair.uid
                    }
                }
            }
        }
    };

    constructor( params :IPair) {

        super({
            shape: new PairShape(params),
            abi: Pair.ABI,
            required: ['id', 'network_id', 'created_at'],
            table: 'pairs'
        });

        if(!(this.shape instanceof PairShape))
            throw new Error("Invalid Shape.");
                
    }

    get should_save() :boolean {
        return Pair.use_save ? (this.shape.token0 !== undefined && this.shape.token1 !== undefined) : false;
    }

    /* 
        Resolvable.resolve(source: any) :Promise<any>
    */
    async resolve(safe: SafeWeb3) :Promise<Pair> {

        if(safe.w3 === undefined) throw new Error("Resolve failed due an invalid instance of Web3 Provided.");

        let result: PairShape = new PairShape(this.shape);

        try{
    
            var myContractInstance = new (safe.w3).eth.Contract( this.abi, this.shape.address);

            try {
                result.name = await myContractInstance.methods.name().call();
            }catch(e){}

            try {
                result.symbol = await myContractInstance.methods.symbol().call();
            }catch(e){}

            try {
                result.token0 = await myContractInstance.methods.token0().call();
            }catch(e){}

            try {
                result.token1 = await myContractInstance.methods.token1().call();
            }catch(e){}

            try {
                result.reserve0 = await myContractInstance.methods.reserve0().call();
            }catch(e){}

            try {
                result.reserve1 = await myContractInstance.methods.reserve1().call();
            }catch(e){}

            try {
                result.factory = await myContractInstance.methods.factory().call();
            }catch(e){}

            try {
                result.totalSupply = await myContractInstance.methods.totalSupply().call(); 
            }catch(e){}
            
            this.shape = result;
            return this;

        }catch(err){ 
            this.shape = result;
            return this;
        }
        
    }

    static async all(db: Database, limit?: number): Promise<Pair[]> {
        let q = "SELECT * FROM pairs ";
        if(limit)
            q += `ORDER BY created_at ASC LIMIT ${limit}`;

        let r :RowDataPacket[] | null = await db.query(q);
        if( r === null) return [];
        let f: Pair[] = [];
        for(let x of r)
            f.push(new Pair({
                id: x['id'],
                name: x['name'],
                address: x['address'],
                created_at: x['created_at'],
                network_id: x['network_id'],
                symbol: x['symbol'],
                token0: x['token0'],
                token1: x['token1'],
                reserve0: x['reserve0'],
                reserve1: x['reserve1'],
                factory: x['factory'],
                totalSupply: x['totalSupply']
            }));
        
        return f;
    }

    async tvl({safe, router}: {safe: SafeWeb3, router: string}): Promise<number> {

        if(safe.w3 === undefined) throw new Error('[PAIR] SafeWeb3 Down.');
        if(!this.shape.token0 || !this.shape.token1) throw new Error('[PAIR] Cannot getPrice on a not resolved Pair.');

        try{
            let pair_contract = new (safe.w3).eth.Contract(Pair.ABI, this.shape.address);
            let _tvl = 0;

            const token0 = new safe.w3.eth.Contract(ERC20.ABI, this.shape.token0);
            const token1 = new safe.w3.eth.Contract(ERC20.ABI, this.shape.token1);

            const t0_decimals = Number(await token0.methods.decimals().call());
            const t1_decimals = Number(await token1.methods.decimals().call());

            const reserves = await pair_contract.methods.getReserves().call();
            const reserve0 = reserves[0];
            const reserve1 = reserves[1];

            const t1_t0_price = await getPrice({ w3: safe.w3, router_address: router, path: [ this.shape.token1, this.shape.token0 ] });

            let t0_usdc_price = 1;
            if(this.shape.token0.toLowerCase() !== safe.network.common["USDC"].toLowerCase())
                t0_usdc_price = await getPrice({ w3: safe.w3, router_address: router, path: [ this.shape.token0, safe.network.common["USDC"] ] });
            
            const t1_usdc_price = t1_t0_price * t0_usdc_price; // rekt paths! <3

            const t0_vl = new BigNumber(reserve0).shiftedBy(-1*t0_decimals).toNumber() * t0_usdc_price;
            const t1_vl = new BigNumber(reserve1).shiftedBy(-1*t1_decimals).toNumber() * t1_usdc_price;

            _tvl += (t0_vl + t1_vl);

            return _tvl;
        }catch(err){
            throw new Error(`${Colors.RED}[PAIR] tvl(): ${err} ${Colors.RESET}`)
        }
    }

    async getPrice(safe: SafeWeb3, router: string): Promise<number> {
        if(safe.w3 === undefined) throw new Error('[PAIR] SafeWeb3 Down.');
        try{
            const pair_contract = new (safe.w3).eth.Contract(Pair.ABI, this.shape.address);
            const pair_decimals = Number(await pair_contract.methods.decimals().call());
            const tvl: number = await this.tvl({safe: safe, router: router});
            const supply: number = new BigNumber(await pair_contract.methods.totalSupply().call()).shiftedBy(-1*pair_decimals).toNumber();
            const price: number = (tvl / supply);
            //console.log("[PAIR] Supply %s | tvl %s | price %s", supply, tvl, price.toFixed(18));
            return price;
        }catch(err){
            throw new Error(`${Colors.RED}[PAIR] getPrice(): ${err} ${Colors.RESET}`)
        }
    }

    async token0(db: Database): Promise<ERC20 | undefined> {
        if(!this.shape.token0) return undefined;
        let t0 = await ERC20.get(db, `address="${this.shape.token0}"`);

        return t0 !== null 
            ? t0 
            : new ERC20({
                address: this.shape.token0,
                network_id: this.shape.network_id,
                created_at: new Date()
            });
    }

    async token1(db: Database): Promise<ERC20 | undefined> {
        if(!this.shape.token1) return undefined;
        let t1 = await ERC20.get(db, `address="${this.shape.token1}"`);

        return t1 !== null 
            ? t1 
            : new ERC20({
                address: this.shape.token1,
                network_id: this.shape.network_id,
                created_at: new Date()
            });
    }

    async filter(safe: SafeWeb3): Promise<Pair | null> {
        
        let filter = new ContractFilter(safe);
        filter.setRules([Pair.filterRules]);
        let opcode: string | undefined = await safe.w3?.eth.getCode(this.shape.address);
        if(opcode === undefined) return null;
        let entity_name: UniqueID | null = await filter.load({
            code: opcode,
            address: this.shape.address
        }).filter();

        if(entity_name === Pair.uid) return this;
        else return null;
    }

    async updateTvl({safe, router, db}: {safe: SafeWeb3, router: string, db: Database}): Promise<number> {
        try{
            let tvl = await this.tvl({safe, router});
            let q = db.f(`INSERT IGNORE INTO pairs_tvl (address, tvl, created_at) VALUES (?,?,?)`, [this.shape.address, tvl, new Date()]);
            await db.query(q);
            return tvl;
        }catch(err){
            console.log(`${Colors.RED}[PAIR] updateTvl(): ${err}${Colors.RESET}`);
            return 0;
        }
    }

    static ignore(): void {
        Pair.use_save = false;    
    }
}