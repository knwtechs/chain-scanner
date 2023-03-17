import { Contract } from 'web3-eth-contract';
import { SafeWeb3, ListenerMonitor } from './';
import { AbiItem } from 'web3-utils';
import { Colors } from '../utils';

export type fnEHandler = (listener: Listener, event: any) => void;
export type ListenerData = { handler?: fnEHandler; event: string; }

export class Listener {

    contract: Contract | undefined;
    for: string;
    safe: SafeWeb3;
    name: string;
    contractInfo: {
        abi: AbiItem[],
        address: string
    };

    constructor(name:string, safe: SafeWeb3, for_model: string, {abi, address}: { abi: AbiItem[], address: string}){
        if(safe.w3 === undefined) throw new Error('Load SafeWeb3 before to instanciate a Listener.');
        this.name = name;
        this.for = for_model;
        this.safe = safe;
        this.contractInfo = { 
            abi: abi,
            address: address
        };
    }

    async listenTo(data: ListenerData[]) : Promise<void> {

        console.log(`${Colors.BRIGHT_BLUE}[LISTENER][${this.name.toUpperCase()}] on ${data.map( o => o.event).join(", ")}${Colors.RESET}`);
        ListenerMonitor.run(this);

        try{

            if(!this.safe.w3){
                ListenerMonitor.error(this);
                return;
            }

            this.contract = new this.safe.w3.eth.Contract(this.contractInfo.abi, this.contractInfo.address);
            this.contract.events.allEvents({fromBlock: 0})
            .on('data', (e :any) => {

                for(let d of data){
                    if(d.event == e.event){
                        if(d.handler) d.handler(this, e);
                        else console.log(`${Colors.MAGENTA}[EVENT][${this.name}] ${e.event}: ${Object.keys(e.returnValues).filter(k => k.length > 1).map(k => { if( k.length > 1) return `${k}: ${e.returnValues[k]}` }).join(", ")}${Colors.RESET}`);
                    }
                }

            }).on('error', async (err: any) => {
                //console.log(`${Colors.RED}[${this.name.toUpperCase()}]: ${err}.${Colors.RESET}`);
                ListenerMonitor.error(this);
                return;
            });

        }catch(err){
            console.log(`${Colors.RED}[LISTENER][${this.name}] Exit.${Colors.RESET}`);
            ListenerMonitor.error(this);
        }
    }

}