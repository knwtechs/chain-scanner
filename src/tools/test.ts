import { IConfig } from '../interfaces';
import { SafeWeb3 } from '../class/base';
import { Network } from '../class/models';
import { Contract } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';
import { has_method, getPrice } from '../class/utils';
import { Pair,MasterChef } from '../class/entities';

type fnArgs = { safe: SafeWeb3, address: string, abi: AbiItem[]};

/* TESTS ARE ALL LOCATED IN THIS ARRAY. EDIT ONLY THAT. */
const battery = [

    async (args: fnArgs) :Promise<void> => {

        const TEST_NAME = "getReserves"
        try{
            if(safe.w3 === undefined) throw new Error();
            let contract: Contract = new (safe.w3).eth.Contract(abi, args.address);   
            let code = await safe.w3?.eth.getCode(contract.options.address);
            let has = await has_method(safe.w3, code, TEST_NAME);
            if(has === true){
                let response = await contract.methods[TEST_NAME]().call();
                console.log(TEST_NAME + ": %s", response);
            }else console.log(TEST_NAME + ": fail");
        }catch(err){
            console.log(TEST_NAME + ": failed with error" + err);
        }
        
    },

    async (args: fnArgs) :Promise<void> => {

        const TEST_NAME = "factory"
        
        try{
            if(safe.w3 === undefined) throw new Error();
            let contract: Contract = new safe.w3.eth.Contract(abi, args.address);   
            let code = await safe.w3.eth.getCode(contract.options.address);
            let has = await has_method(safe.w3, code, TEST_NAME);
            if(has === true){
                let response = await contract.methods[TEST_NAME]().call();
                console.log(TEST_NAME + ": %s", response);
            }else console.log(TEST_NAME + ": fail");
        }catch(err){
            console.log(TEST_NAME + ": failed with error");
        }
        
    },

    async (args: fnArgs) :Promise<void> => {

        const TEST_NAME = "name"
        
        try{
            if(safe.w3 === undefined) throw new Error();
            let contract: Contract = new safe.w3.eth.Contract(abi, args.address);
            let response = await contract.methods[TEST_NAME]().call();
            console.log(TEST_NAME + ": %s", response);
        }catch(err){
            console.log(TEST_NAME + ": failed with error");
        }
        
    },
    
    async (args: fnArgs) :Promise<void> => {

        const TEST_NAME = "deposit"
        
        try{
            if(safe.w3 === undefined) throw new Error();
            let contract: Contract = new safe.w3.eth.Contract(abi, args.address);   
            let code = await safe.w3.eth.getCode(contract.options.address);
            let has = await has_method(safe.w3, code, TEST_NAME);
            if(has === true){
                let response = await contract.methods[TEST_NAME]().call();
                console.log(TEST_NAME + ": %s", response);
            }else console.log(TEST_NAME + ": fail");
        }catch(err){
            console.log(TEST_NAME + ": failed with error");
        }
        
    },

    async (args: fnArgs) :Promise<void> => {

        const TEST_NAME = "symbol"
        
        try{
            if(safe.w3 === undefined) throw new Error();
            let contract: Contract = new safe.w3.eth.Contract(abi, args.address);   
            let code = await safe.w3.eth.getCode(contract.options.address);
            let has = await has_method(safe.w3, code, TEST_NAME);
            if(has === true){
                let response = await contract.methods[TEST_NAME]().call();
                console.log(TEST_NAME + ": %s", response);
            }else console.log(TEST_NAME + ": fail");
        }catch(err){
            console.log(TEST_NAME + ": failed with error");
        }
        
    },

    async (args: fnArgs) :Promise<void> => {

        const TEST_NAME = "getPairs"
        
        try{
            if(safe.w3 === undefined) throw new Error();
            let mc = new MasterChef({
                address: args.address,
                created_at: new Date(),
                network_id: 2
            });
            let pairs = await mc.getPairs(safe);
            if(pairs.length > 0){
                console.log(TEST_NAME + ": %s", pairs.length);
            }else console.log(TEST_NAME + ": fail");
        }catch(err){
            console.log(TEST_NAME + ": failed with error: %s", err);
        }
    },

    /*async (args: fnArgs) :Promise<void> => {

        const TEST_NAME = "Pair.filter()"
        
        try{
            if(safe.w3 === undefined) throw new Error();
            let mc = new MasterChef({
                address: args.address,
                created_at: new Date(),
                network_id: 2
            });
            let pairs = await mc.getPairs(safe);
            if(pairs.length > 0){
                for(let x of pairs){
                    let p: Pair | null = await x.filter(safe);
                    if(p) console.log("\t %s is PAIR", x.shape.address);
                    else console.log("\t %s not a PAIR", x.shape.address);
                }
            }else console.log(TEST_NAME + ": fail");
        }catch(err){
            console.log(TEST_NAME + ": failed with error: %s", err);
        }
        
    },*/

    async (args: fnArgs) :Promise<void> => {

        const TEST_NAME = "getPrice"
        
        try{

            if(safe.w3 === undefined) throw new Error();
            let price = await getPrice({
                w3: safe.w3,
                router_address: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",
                path: [
                    "0xa3Fa99A148fA48D14Ed51d610c367C61876997F1",
                    "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"
                ]
            });
            console.log(TEST_NAME + ": %s", price);
        }catch(err){
            console.log(TEST_NAME + ": failed with error: %s", err);
        }
        
    },

    async (args: fnArgs) :Promise<void> => {

        const TEST_NAME = "Pair.tvl()";
        
        try{
            if(safe.w3 === undefined) throw new Error();
            let pair = new Pair({
                address: "0xadbf1854e5883eb8aa7baf50705338739e558e5b",
                created_at: new Date(),
                network_id: 2
            });
            let resolved = await pair.resolve(safe);
            let tvl = await resolved.tvl({safe: safe, router: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff"});
            console.log(TEST_NAME + ": %s", tvl);
        }catch(err){
            console.log(TEST_NAME + ": failed with error: %s", err);
        }
    },

    async (args: fnArgs) :Promise<void> => {

        const TEST_NAME = "Pair.getPrice()";
        
        try{
            
            if(safe.w3 === undefined) throw new Error();

            let pair = new Pair({
                address: "0xadbf1854e5883eb8aa7baf50705338739e558e5b",
                created_at: new Date(),
                network_id: 2
            });

            let resolved = await pair.resolve(safe);
            let price = await resolved.getPrice(safe, "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff");
            console.log(TEST_NAME + ": %s", price);
        }catch(err){
            console.log(TEST_NAME + ": failed with error: %s", err);
        }
    },

    async (args: fnArgs) :Promise<void> => {

        const TEST_NAME = "MasterChef.tvl()";
        
        try{
            if(safe.w3 === undefined) throw new Error();
            let mc = new MasterChef({
                address: args.address,
                created_at: new Date(),
                network_id: 2
            });
            let tvl = await mc.tvl({safe: safe, router: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff"});
            console.log(TEST_NAME + ": %s $", tvl);
        }catch(err){
            console.log(TEST_NAME + ": failed with error: %s", err);
        }
    },

];

const config :IConfig = require('./config/config.js').config;
let net :Network | undefined = config.networks.find( el => el.name == config.network);
if(net === undefined){ console.log("Wrong Network."); process.exit(); }
const safe :SafeWeb3 = new SafeWeb3({ network: new Network(net) });

let abi: AbiItem[] = require('./abis/masterchef.json') as AbiItem[];

if(safe.load()){
    for(let t of battery){
        try{
            t({safe: safe, address: "0xB664c98548CEbf7024F899e32E467dff00311918", abi: abi})
            .then();
        }catch(err){} 
    }
}








