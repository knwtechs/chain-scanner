import { SafeWeb3, Listener, Database, Scanner, fnEHandler, Clock, ListenerMonitor } from "./";
import { MasterChef } from "../entities";
import { IConfig, INetwork } from "../../interfaces";
import { Factory, Network } from "../models";
import { TransactionReceipt } from 'web3-eth';
import { AbiItem } from 'web3-utils';
import { Colors, Timings } from "../utils";
import { FilterRulesItem } from './ContractFilter';
import { Mailer } from "./Mailer";

export type EventsMap = {
    [name :string]: {
        abi: AbiItem[];
        events: {
            event: string,
            handler?: fnEHandler
        }[]
    }
}

export type IApp = {
    config: IConfig,
    rules: FilterRulesItem[]
    scanHandler?: ScannerFunction,
}
export type ScannerFunction = (scanner: Scanner, receipt: TransactionReceipt) => Promise<void>;
export class App {

    config: IConfig;
    network: Network;
    db: Database;
    safe: SafeWeb3;
    eventsMap: EventsMap | undefined;
    scanner: Scanner;
    clock: Clock;
    mailer: Mailer;
    fnScan?: ScannerFunction;

    constructor({
        config,
        scanHandler,
        rules
    }: IApp){

        this.config = config;
        this.network = this.getNetwork();
        this.db = new Database(config.db, true);

        this.safe = new SafeWeb3({
            network: this.network
        });

        if(!this.safe.load())
            throw new Error(SafeWeb3.DOWNERROR);
        
        this.scanner = new Scanner({
            safe: this.safe,
            db: this.db,
            network: this.network,
            log: this.config.log,
            filterRules: rules,
            fnScan: scanHandler
        });
        this.mailer = new Mailer(config.mailer);
        this.clock = new Clock();
    }

    get apt() {
        return this.scanner.apt.toFixed(0);
    }

    getMailer(): Mailer {
        return this.mailer;
    }

    getNetwork(): Network {
        let net :INetwork | undefined = this.config.networks.find( el => el.name == this.config.network);
        if(net === undefined)
            net = this.config.networks[0];
        
        return new Network(net);
    }

    loadEvents(map: EventsMap): void {
        this.eventsMap = map;
    }

    async handleEvents(): Promise<void> {

        if(this.eventsMap === undefined) return;
        let eventsMap = this.eventsMap;
        for(let e in this.eventsMap){
            switch(e){
                case 'Factory':
                    Factory.all(this.db).then(async collection => {
                        if(collection.length == 0) return;
                        collection.map(async f => {
                            if(f===null) process.exit();
                            let E = eventsMap[f.constructor.name];
                            try{
                                new Listener(f.name, this.safe, f.constructor.name, { abi: E.abi, address: f.address})
                                .listenTo(E.events);
                            }catch(err){
                                console.log(`${Colors.RED}[LISTENER][${f.constructor.name}] ${err}${Colors.RESET}`);
                            }
                        });
                    });
                break;
                case 'MasterChef':
                    MasterChef.all(this.db).then(async collection => {
                        collection.map(async (m, i) => {
                            if(m===null) process.exit();
                            let E = eventsMap[m.constructor.name];
                            try{
                                new Listener([MasterChef.uid, m.shape.name ?? i].join(" "), this.safe, m.constructor.name, { abi: E.abi, address: m.shape.address})
                                .listenTo(E.events);
                            }catch(err){
                                console.log(`${Colors.RED}[LISTENER][${m.constructor.name}] ${err}${Colors.RESET}`);
                            }
                        });
                    });
                break;
            }
        }
    }

    addClockMethod({name, fn, thick} :{name: string, fn: Function, thick: number}) :boolean {
        if(!this.clock.get(name)){
            this.clock.addTimer(name, fn, thick);
            return true;
        }
        return false;
    }

    useProcessMonitor = (thick: number = Timings.s(10)) => {
        this.addClockMethod({
            name: 'Process_Monitor',
            fn: async (): Promise<void> => {
                for(let x of ListenerMonitor.listeners()){
                    console.log(x);
                    if(!ListenerMonitor.running(x) && this.eventsMap !== undefined){
                        if(!(x.for in this.eventsMap)) continue;
                        console.log(`${Colors.YELLOW}[MONITOR][LISTENER][${x.name}] Restarting...${Colors.RESET}`);
                        x.listenTo(this.eventsMap[x.for].events);
                    }
                }
            },
            thick: thick
        });
    }

    async run({
        useDB,
        useEvents,
        useClock,
        useScanner,
        useMailer
    }: {
        useDB: boolean,
        useEvents: boolean,
        useClock: boolean,
        useScanner: boolean,
        useMailer: boolean
    } = {
        useDB: true,
        useEvents: true,
        useClock: true,
        useScanner: true,
        useMailer: true
    }): Promise<void>{
        if(useDB) await this.db.connect();
        if(useEvents) this.handleEvents();
        if(useClock) this.clock.init();
        if(useScanner) this.scanner.init();
        if(useMailer) this.mailer.init();
    }

}