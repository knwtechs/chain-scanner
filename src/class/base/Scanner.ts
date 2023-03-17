
import { Block, Transaction } from 'web3-eth';
import { SafeWeb3, Database, ContractFilter, FilterRulesItem, ScannerFunction } from '../base';
import { Colors } from '../utils';
import { Network } from '../models';

class BlockInfo {

    number :number;
    transactions: Array<Transaction> | string[];
    is_processed: boolean;

    constructor(block :Block){
        this.number = block.number;
        this.transactions = block.transactions;
        this.is_processed = false;
    }

    /**
     * Check if this block has been processed
     *
     * @returns true if the block has been processed, false otherwise
     */
    processed() :boolean {
        return this.is_processed;
    }

    /**
     * Mark this block as processed
     *
     * @returns None
     */
    process() :void {
        this.is_processed = true;
    }

}

export class Scanner {

    static TIMEOUT: number = SafeWeb3.TIMEOUT + 1000;
    static SCANNING: boolean = false;
    safe :SafeWeb3;
    dbengine :Database;
    network :Network;
    start_block :number;
    LOG: boolean;
    filter: ContractFilter;
    fnScan: ScannerFunction | undefined;
    apt: number = 0; // Average processing time
    q: any[] = []

    constructor({safe, db, network, log, filterRules, fnScan} :{
        safe: SafeWeb3;
        db: Database,
        network: Network,
        log: boolean;
        filterRules: FilterRulesItem[];
        fnScan?: ScannerFunction;
    }){
        if(safe.w3 === undefined) throw new Error('Load SafeWeb3 before to instanciate a Scanner.');
        this.safe = safe;
        this.dbengine = db;
        this.network = network;
        this.LOG = log;
        this.start_block = 0;
        this.filter = new ContractFilter(safe);
        this.filter.setRules(filterRules);
        this.filter.print();
        this.fnScan = fnScan;
    }

    /**
     *  Process a block
     *
     * @param blockInfo - A BlockInfo object representing the block to process
     * @returns the number of tx cointained in the processed block
     *
     * @beta
     */
    __process_block = async (blockInfo :BlockInfo) :Promise<number> => {
        //console.log(`[SCANNER] Processing block #${blockInfo.number}`);
        if(blockInfo.number > 0){
            this.__digest_transactions(blockInfo).then( () => {
                blockInfo.process();
            });
        }
        return blockInfo.transactions.length;
    
    }

    /**
     *  Process a list of transactions
     *
     * @param blockInfo - A BlockInfo object representing the block to process transactions.
     * @returns the number of processed tx
     *
     * @beta
     */
    __digest_transactions = async (blockInfo :BlockInfo) :Promise<number> => {

        let i = 0;
    
        blockInfo.transactions.forEach( (tx_address: string | Transaction) => {
            i++;
            this.__digest_transaction(tx_address).catch( err => {
                console.log("Cannot digest transactions of #"+tx_address + " --- " + err);
            });
            if(i == blockInfo.transactions.length && this.LOG)
                process.stdout.write("\t[" + i + "]")
    
        });
        
        return blockInfo.transactions.length;
    }

    /**
     *  Process a transaction
     *
     * @param tx_address - A string representing a TXID or a web3-eth.Transaction object
     * @returns None
     *
     * @beta
     */
    __digest_transaction = async (tx_address : string | Transaction) :Promise<void> => {

        if(typeof(tx_address) !== 'string') return;

        this.safe.w3?.eth.getTransaction(tx_address).then( (tx) => {
    
            if(tx == null) return;

            // If i want only contracts
            // if( tx.to != null ) return
            this.safe.w3?.eth.getTransactionReceipt(tx_address).then( (receipt) => {
                if(!receipt) return;
                if(this.fnScan)
                    this.fnScan(this, receipt);
            });
    
        }).catch( (err) => {
            throw err;
        });
    }

    /**
     *  Initialize this scanner and subscribe to 'newBlockHeaders'
     * @returns None
     *
     * @beta
     */
    init = async () :Promise<void> => {

        if(!this.safe.w3) throw new Error(SafeWeb3.DOWNERROR);
        this.safe.w3.eth.subscribe('newBlockHeaders', (error, result) => {
            if (!error) return;
            console.log(`${Colors.RED}[SUBSCRIPTION]${error}${Colors.RESET}`);
        })
        .on("connected", subscriptionId => {
            console.log(`${Colors.BRIGHT_BLUE}[SCANNER] You are connected on ${this.safe.currentProvider} @${subscriptionId}.${Colors.RESET}`);
            console.log(`${Colors.BRIGHT_BLUE}[SCANNER] Running.${Colors.RESET}`);
        })
        .on('data', block => {
            if(this.start_block == 0) this.start_block = block.number;
            if(!this.safe.w3) throw new Error(SafeWeb3.DOWNERROR);
            if(this.LOG)
                console.time(`${Colors.BRIGHT_CYAN}process_block_#${block.number}${Colors.RESET}`);

            let sbpt = Date.now(); // start block processing timestamp
            this.safe.w3.eth.getBlock(block.number).then( _block => {
                if(_block){
                    if(this.LOG) process.stdout.write(`\n[${block.number}] Fetching...`);
                    if(_block.transactions.length > 0){
                        var blInfo = new BlockInfo(_block);
                        this.__process_block(blInfo).then( (txs) => {
                            if(this.LOG) console.timeEnd(`${Colors.BRIGHT_CYAN}process_block_#${block.number}${Colors.RESET}`);
                            if(this.apt > 0) this.apt = (this.apt + (Date.now() - sbpt) ) / 2;
                            else this.apt = Date.now() - sbpt;
                            if(this.LOG) process.stdout.write(`  ->  OK {${txs}} [${_block.number}] [${new Date().toLocaleTimeString()}]\n`)
                        }).catch(err => console.log(err));
                    }else{
                        if(this.LOG) process.stdout.write(`  ->  SKIP [${block.number}]\n`)
                    }
                }
            }).catch( err => {
                process.stdout.write(`${err} -> KO\n`);
            });
        })
        .on('error', async error => {
            console.log(`${Colors.RED}[SCANNER] Web3 not available.${Colors.RESET}`);
            if(SafeWeb3.RELOAD) this.safe.reload();
            if(this.fnScan === undefined){
                console.log(`${Colors.RED}[SCANNER] Exit.${Colors.RESET}`);
                process.exit();  
            }
            this.init();
            console.log(`${Colors.RED}[SCANNER] Restarted.${Colors.RESET}`);
        });
    }

    /**
     *  This is a usefull queue reliable in differents use cases
     * @returns The queue
     *
     * @beta
     */
    get_queue(): any[] {
        return this.q;
    }

    /**
     *  Returns the queue lenght
     * @returns None
     *
     * @beta
     */
    queue_length(): number {
        return this.q.length;
    }

    /**
     *  Push a new element to the queue
     * @param e the new element to add to the queue
     * @returns The queue new length
     *
     * @beta
     */
    queue_push(e: any): number {
        return this.q.push(e);
    }

    /**
     *  Pop the last element from the queue.
     * @returns The last element of the queue
     *
     * @beta
     */
    queue_pop(): any {
        return this.q.pop();
    }



}