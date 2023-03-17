import { SafeWeb3 } from './SafeWeb3';
import { Database } from './Database';
import { Pair } from '../entities';
import { Factory } from '../models/Factory';
import { Colors } from '../utils';
import { Contract } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';

type ArbiterToken = {
    name: string;
    address: string;
    decimals: number;
}

type ArbiterConfig = {
    tokens: {
        [network: string]: ArbiterToken[];
    }
    config: {
        factory: string;
        router: string
    }[];
}

type ArbiterPair = {
    address: string;
    token0: string | ArbiterToken;
    token1: string | ArbiterToken;
    rate: number;
}

type ArbiterFactory = {
    address: string;
    pairs: ArbiterPair[];
}

class Router {

    abi: AbiItem[] = [
        {
            "inputs": [
                {
                    "internalType":"uint256",
                    "name":"amountIn",
                    "type":"uint256"
                },
                {
                    "internalType":"address[]",
                    "name":"path",
                    "type":"address[]"
                }
            ],
            "name":"getAmountsOut",
            "outputs":[
                {
                    "internalType":"uint256[]",
                    "name":"amounts",
                    "type":"uint256[]"
                }
            ],
            "stateMutability":"view",
            "type":"function"
        }
    ];
    safe: SafeWeb3;
    address: string;
    contract: Contract;

    constructor(safe: SafeWeb3, address: string) {
        if(!safe.w3)
            throw new Error('[SAFEWEB3] Unavailable.');
        this.safe = safe;
        this.contract = new safe.w3.eth.Contract(this.abi, address);
        this.address = address;
    }

    async getAmountsOut(path: string[], amountIn: number): Promise<[number,number]> {
        let a = await this.contract.methods.getAmountsOut(amountIn, path).call();
        return [a[path.length-1], amountIn / a[path.length-1]] ?? [0,0];
    }

    public toString = () : string => {
        return `Router (address: ${this.address})`;
    }
}

export class Arbiter {

    safe: SafeWeb3;
    db: Database;
    pairs: Pair[];
    factories: ArbiterFactory[];
    routers: Router[];
    fetched_pairs: Map<Factory, ArbiterPair[]>;
    tokens: ArbiterToken[];

    constructor({safe, db, config}: {safe: SafeWeb3, db: Database, config: ArbiterConfig}){
        this.safe = safe;
        this.db = db;
        this.pairs = new Array<Pair>();
        this.factories = new Array<ArbiterFactory>();
        this.routers = new Array<Router>();
        this.fetched_pairs = new Map<Factory, ArbiterPair[]>();
        this.tokens = config.tokens[safe.network.name];
        this.loadFactoryAndRouters(config.config);
    }

    /*
    async loadFactoriesFromDB(factories?: Factory[]): Promise<void> {
        
        Factory.all(this.db).then((coll) => {
            coll.forEach(el => {
                this.factories.push()
            });
        });

        if(factories){
            factories.forEach(el => {
                this.factories.push(el);
            });
        }
    }

    private async _loadPairsFromDB(): Promise<void>{
        Pair.all(this.db).then((pairs) => {
            this.pairs = pairs;
        });
    }
    */

    loadFactoryAndRouters(data: {factory: string, router: string}[]): void {
        for(let d of data) {
            this.factories.push({
                address: d.factory,
                pairs: []
            });
            this.routers.push(new Router(this.safe,d.router));
        }
    }

    async fetchPairsFromFactories() {

        if(this.safe.w3 === undefined)
            throw new Error(`${Colors.RED}[ARBITER] SAFEWEB3 Unavailable.${Colors.RESET}`);

        for(let k=0;k<this.factories.length-1;k++){

            let contract = new (this.safe.w3).eth.Contract(Factory.ABI, this.factories[k].address);
            let pairs: ArbiterPair[] = new Array<ArbiterPair>();

            for(let i=0; i<this.tokens.length; i++){
                for(let j=0; j<this.tokens.length; j++){
                    if(this.tokens[i].address == this.tokens[j].address)
                        continue;
                    try{
                        let p = await contract.methods.getPair(this.tokens[i].address,this.tokens[j].address).call();
                        pairs.push({
                            address: p,
                            token0: this.tokens[i],
                            token1: this.tokens[j],
                            rate: (await this.routers[k].getAmountsOut([this.tokens[i].address,this.tokens[j].address],10^(this.tokens[j].decimals)))[0]
                        } as ArbiterPair);
                    }catch(err){
                        console.log(`${Colors.RED}[ARBITER] getPair: ${err} ${Colors.RESET}`);
                    }
                }
            }
            this.factories[k].pairs = pairs;
        }
    
    }

    async play() {
        await this.fetchPairsFromFactories()
        let sum = this.factories.map( el => {return el.pairs.length}).reduce((partial, a) => partial + a, 0);
        console.log(`${Colors.BRIGHT_GREEN}[ARBITER]: Ready with ${this.factories.length} factories and a total of ${sum} pairs (${sum % this.factories.length} unmatched) ${Colors.RESET}`);
        console.log(this.factories[0]);
    }

}