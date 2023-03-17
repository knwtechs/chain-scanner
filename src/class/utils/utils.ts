import Web3 from 'web3';
import axios from 'axios';
import { IConfig } from '../../interfaces/IConfig';
import { BigNumber } from 'bignumber.js';
import { Network } from '../models';
import { AbiItem } from 'web3-utils';

const config :IConfig = require('../../config/config.js').config;

export const delay = (ms :number) => new Promise(res => setTimeout(res, ms));

export const editDistance = (s1 :string, s2 :string) :number => {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();
  
    var costs = new Array();
    for (var i = 0; i <= s1.length; i++) {
      var lastValue = i;
      for (var j = 0; j <= s2.length; j++) {
        if (i == 0)
          costs[j] = j;
        else {
          if (j > 0) {
            var newValue = costs[j - 1];
            if (s1.charAt(i - 1) != s2.charAt(j - 1))
              newValue = Math.min(Math.min(newValue, lastValue),
                costs[j]) + 1;
            costs[j - 1] = lastValue;
            lastValue = newValue;
          }
        }
      }
      if (i > 0)
        costs[s2.length] = lastValue;
    }
    return costs[s2.length];
}

export const strcompare = (s1 :string, s2 :string) :number => {
    var longer = s1;
    var shorter = s2;
    if (s1.length < s2.length) {
        longer = s2;
        shorter = s1;
    }
    var longerLength :number = longer.length;
    if (longerLength == 0) {
        return 1.0;
    }
    return (longerLength - editDistance(longer, shorter)) / longerLength;
}

export const strarraycompare = (s :string, A :Array<string>) :[string,number] => {
    var max = 0;
    var best = "";
    for(let i=0;i<A.length-1;i++){
        let v = strcompare(s,A[i]);
        if( v > max){
            max = v;
            best = A[i];
        }
        //console.log("(" + s + ") : (" + A[i] + ") = " + v);
    }
    return [best,max];
}

export const get_host_from_url = (url :string) :string => {
  try{
    return new URL(url).hostname;
  }catch(e){ return ""; }
}

export const has_method =  async (w3 :Web3, code :string, signature :string) :Promise<boolean> => {
  const hash = w3.eth.abi.encodeFunctionSignature(signature);
  return code.indexOf(hash.slice(2, hash.length)) > 0;
}

export const truncate = (str :string, n? :number) => {
  if(n == undefined) n = 32;
  return (str.length > n) ? str.substring(0, n-1) : str;
};

export const cleanString = (inp : string | any) => {
  if(inp == undefined) return "";
  if(typeof inp != "string") return inp;

  var input = truncate(inp);
  var output = "";
  for (var i=0; i<input.length; i++) {
      if (input.charCodeAt(i) <= 127) {
          output += input.charAt(i);
      }
  }
  return output;
}

export const getPrice = async ({ w3, router_address, path }: { w3: Web3, router_address: string, path: string[] }): Promise<number> => {

    if(path.length !== new Set(path).size) throw new Error(`[GETPRICE] Wrong path: ${path}`);

    const token_abi: AbiItem[] = [{
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [
            {
                "name": "",
                "type": "uint8"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }];

    const router_abi: AbiItem[] = [{
        "inputs": [
            {
                "internalType": "uint256",
                "name": "amountIn",
                "type": "uint256"
            },
            {
                "internalType": "address[]",
                "name": "path",
                "type": "address[]"
            }
        ],
        "name": "getAmountsOut",
        "outputs": [
            {
                "internalType": "uint256[]",
                "name": "amounts",
                "type": "uint256[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }];

    const router = new w3.eth.Contract( router_abi, router_address );
    const token_in = new w3.eth.Contract( token_abi, path[0] );
    const token_out = new w3.eth.Contract( token_abi, path[path.length-1] );
    
    let tin_decimals = Number(await token_in.methods.decimals().call());
    let tout_decimals = Number(await token_out.methods.decimals().call());
    let base_amt = new BigNumber(1).shiftedBy(tin_decimals);

    try{

        let amt = await router.methods.getAmountsOut(base_amt, path).call();
        let p = new BigNumber(amt[amt.length-1]);
        return p.shiftedBy(-1*tout_decimals).toNumber();

    }catch(err){
        //console.log(`${Colors.RED}[UTILS] getPrice(): ${err} ${Colors.RESET}`);
        return 0;
    }
}

export const getCostantProduct = async ({ w3, pair }: { w3: Web3, pair: {a: string, b: string, p: string} }): Promise<number> => {

    const token_abi: AbiItem[] = [{
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [
            {
                "name": "",
                "type": "uint8"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }];

    const pair_abi: AbiItem[] = [{"inputs":[],"name":"getReserves","outputs":[{"internalType":"uint112","name":"_reserve0","type":"uint112"},{"internalType":"uint112","name":"_reserve1","type":"uint112"},{"internalType":"uint32","name":"_blockTimestampLast","type":"uint32"}],"stateMutability":"view","type":"function"}];

    try{
        let pair_contract = new w3.eth.Contract(pair_abi, pair.p);
        const reserves = await pair_contract.methods.getReserves().call();
        const token0 = new w3.eth.Contract(token_abi, pair.a);
        const token1 = new w3.eth.Contract(token_abi, pair.b);
        const t0_decimals = Number(await token0.methods.decimals().call());
        const t1_decimals = Number(await token1.methods.decimals().call());
        return new BigNumber(reserves[0]).shiftedBy(-1*t0_decimals).toNumber() * new BigNumber(reserves[1]).shiftedBy(-1*t1_decimals).toNumber();
    }catch(err){
        console.log(err);
        return 0;
    }
}

export const getPairAddresOffChain = (w3: Web3, factory_address: string, t0: string, t1: string) => {

    const strToHex = (str: string): string => {
        var hex, i;
        var result = "";
        for (i=0; i<str.length; i++) {
            hex = str.charCodeAt(i).toString(16);
            result += ("000"+hex).slice(-4);
        }
        return result
    }

    let tokens = w3.utils.soliditySha3(t0, t1);
    if(!tokens) return "0x0000000000000000000000000000000000000000";
    let encoded_tokens = w3.utils.keccak256(tokens);
    let _packed_data = w3.utils.soliditySha3(
        strToHex('ff'),
        factory_address,
        encoded_tokens,
        strToHex('96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f')
    );
    if(!_packed_data) return "0x0000000000000000000000000000000000000000";
    return w3.utils.keccak256(_packed_data);
}

export namespace BlockExplorer {

  interface ServerData {
      data :string;
      message: string;
      result : string;
  }

  export const get_circulating_supply = async (network: Network, address :string) :Promise<number> => {

      try {
          const response = await axios.get<ServerData>(`https://api.${network.name.toLowerCase()}scan.com/api?module=stats&action=tokenCsupply&contractaddress=${address}&apikey=${network.scan_api}`);
          return new BigNumber(response.data.result).toNumber();
      } catch (error) {
          return -1;
      }
  }

  export const get_owner_balance = async (network: Network, address :string, owner :string) :Promise<number> => {
      try {
          const response = await axios.get<ServerData>(`https://api.${network.name.toLowerCase()}scan.com/api?module=account&action=tokenbalance&contractaddress=${address}&address=${owner}&tag=latest&apikey=${network.scan_api}`);
          return new BigNumber(response.data.result).toNumber();
      } catch (error :any) {
          console.log(error);
          return -1;
      }
  }

  export const is_contract_verified = async (network: Network, address :string) :Promise<boolean> => {
    try {
        const response = await axios.get(`https://api.${network.name.toLowerCase()}scan.com/api?module=contract&action=getabi&address=${address}&apikey=${network.scan_api}`);
        return response.data['status'] == 1;
    } catch (error :any) {
        console.log(`${Colors.RED}[BLOCKEXPLORER] ${network.name.toUpperCase()} API EXPIRED${Colors.RESET}`);
        return false;
    }
}
}

export class Colors {

  /* Modifiers */
  static RESET = "\x1b[0m"
  static BRIGHT = "\x1b[1m"
  static DIM = "\x1b[2m"
  static UNDERSCORE = "\x1b[4m"
  static BLINK = "\x1b[5m"
  static REVERSE = "\x1b[7m"
  static HIDDEN = "\x1b[8m"

  /* Text Colors */
  static BLACK = "\x1b[30m"
  static RED = "\x1b[31m"
  static GREEN = "\x1b[32m"
  static YELLOW = "\x1b[33m"
  static BLUE = "\x1b[34m"
  static MAGENTA = "\x1b[35m"
  static CYAN = "\x1b[36m"
  static WHITE = "\x1b[37m"

  /* Background Colors */
  static BGBLACK = "\x1b[40m"
  static BGRED = "\x1b[41m"
  static BGGREEN = "\x1b[42m"
  static BGYELLOW = "\x1b[43m"
  static BGBLUE = "\x1b[44m"
  static BGMAGENTA = "\x1b[45m"
  static BGCYAN = "\x1b[46m"
  static BGWHITE = "\x1b[47m"

  /* Brights */
  static BRIGHT_RED = Colors.BRIGHT + Colors.RED;
  static BRIGHT_MAGENTA = Colors.BRIGHT + Colors.MAGENTA;
  static BRIGHT_YELLOW = Colors.BRIGHT + Colors.YELLOW;
  static BRIGHT_GREEN = Colors.BRIGHT + Colors.GREEN;
  static BRIGHT_BLUE = Colors.BRIGHT + Colors.BLUE;
  static BRIGHT_CYAN = Colors.BRIGHT + Colors.CYAN;


  static bright(code: string){ return Colors.BRIGHT.concat(code); }
}

export namespace Timings {
    export const s = (n: number): number => { return n*1000 };
    export const m = (n: number): number => { return n*60*1000 };
    export const h = (n: number): number => { return n*60*60*1000 };
}
