import { Colors, has_method } from '../utils';
import { SafeWeb3 } from './SafeWeb3';
import { UniqueID } from '../shapes/Shape';

export type ContractDescriptor = { code: string, address: string; }
export type FilterRules = { items: Array<FilterRulesItem>; }
export type FilterRulesItem = {  rule: string; for: UniqueID; next?: FilterRulesItem | undefined; }

export class ContractFilter {

    contract: ContractDescriptor | undefined;
    safe: SafeWeb3;
    rules: FilterRules;

    constructor(web3: SafeWeb3){
        if(web3.w3 === undefined) throw new Error(`${Colors.RED}[FILTER] Cannot create filter due an invalid instance of Web3 Provided.${Colors.RESET}`);
        this.safe = web3;
        this.rules = { items: new Array<FilterRulesItem>() };
    }

    setRules(rules: FilterRulesItem[]): void {
        this.rules.items = rules;
        //console.log("\x1b[36m[FILTER] Rules loaded.\x1b[0m");
    }

    load(contract: ContractDescriptor) :ContractFilter{
        this.contract = contract;
        return this;
    }

    async filter(): Promise<UniqueID | null> {

        let recursive_filter = async (inp: FilterRulesItem): Promise<UniqueID | null> => {
            if(this.contract === undefined) return null;
            if(this.safe.w3 === undefined) return null;
            let has = await has_method(this.safe.w3, this.contract.code, inp.rule);
            if(has === true){
                if(inp.next)
                    await recursive_filter(inp.next);
                return inp.for;
            }
            return null;
        }

        if(this.rules.items.length == 0){
            console.log("Please load rules first.");
            return null;
        }
        
        if(!this.contract){
            console.log("Please load contract first.")
            return null;
        }

        let result :UniqueID | null = null;
        for(let item of this.rules.items){
            result = await recursive_filter(item);
            if( result !== null)
                return result;
        }
        return result;
    }

    print(): void {

        let o: FilterRulesItem[] = [];

        let iterate = (inp: FilterRulesItem) :FilterRulesItem | void => {
            o.push(inp);
            //console.log("\x1b[36m\t" + inp.rule + "\t\t\t" + inp.for + "\x1b[0m");
            if(inp.next) iterate(inp.next);
        }

        if(this.rules.items.length > 0){
            //console.log("\x1b[36m\x1b[4m\tRule\t\t\t\tFor\x1b[0m")
            for(let x of this.rules.items)
                iterate(x);
            console.table(o,["rule","for"]);
        }
        else console.log(`${Colors.BRIGHT_BLUE}[FILTER] No rules loaded. Probabily there are custom rules written in the scanner_function.${Colors.RESET}`);
        
    }

}