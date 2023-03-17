import { App, Scanner, ScannerFunction } from './class/base';
import { Colors, Timings } from './class/utils';
import { IConfig } from "./interfaces/IConfig";
import { TransactionReceipt } from 'web3-eth';
import { MAIL_TO, MAIL_FROM, MAIL_SUBJECT } from './constants';

const config :IConfig = require('./config/config.js').config;

const fnScan: ScannerFunction = async (scanner: Scanner, receipt: TransactionReceipt) :Promise<void> => {

    // Looking for addresses
    const LFSA = [
        "0x0cac9c3d7196f5bbd76fadcd771fb69b772c0f9d".toLowerCase() // Whale molto seria
    ];
    const NAMES = [ "Whale molto seria" ];
    const LFRA: string[] = LFSA

    let [from, to] = [
        receipt.from ? LFSA.includes(receipt.from.toLowerCase()) ? LFSA[LFSA.indexOf(receipt.from.toLowerCase())] : undefined : undefined,
        receipt.to ? LFRA.includes(receipt.to.toLowerCase()) ? LFRA[LFRA.indexOf(receipt.to.toLowerCase())] : undefined : undefined
    ];
    
    if(from || to){
        let alert = `TX ${receipt.transactionHash} involves address ${ from ? from.concat(" "+NAMES[LFSA.indexOf(from)]).concat(" as sender") : to ? " and " : " " } ${to ? to.concat(" "+NAMES[LFSA.indexOf(to)]).concat(" as recipient") : ""}`;
        console.log(`${Colors.BRIGHT_GREEN}${alert}${Colors.RESET}`);
        app.scanner.queue_push(alert);
    }
}

/* Application creation */
const app = new App({
    config: config,
    scanHandler: fnScan,
    rules: []
});

//app.useProcessMonitor();
// app.addClockMethod({
//     name: 'APT',
//     fn: async () => console.log(`${Colors.BRIGHT_CYAN}[APT] ${app.apt}ms${Colors.RESET}`),
//     thick: Timings.s(10)
// });

app.addClockMethod({
    name: 'Mailer',
    fn: async () => {
        let alert = app.scanner.get_queue().pop();
        if(alert)
            app.mailer.sendMail({ from: MAIL_FROM, to: MAIL_TO, subject: MAIL_SUBJECT, text: alert})
                .then((info) => {
                    console.log(`${Colors.BRIGHT_CYAN}[Mailer] Mail sent: ${info}${Colors.RESET}`)
                })
    },
    thick: Timings.s(10)
});

/* Run the application */
app.run({
    useDB: false,
    useScanner: true,
    useClock: true,
    useEvents: false,
    useMailer: true
}).catch( (err) => {
    console.log(err);
});

/* 
 *  Ignoring entities when scanning
 */

// MasterChef.ignore();
// ERC20.ignore();
// ERC20.use_save = true;
// Pair.ignore();

/*
 *  Load eventsMap, it contains all the events you want to listen to, with the relative handler functions. 
 *  All the events configuration is done through the eventsMap ( see App.eventsMap for more details about its structure).
 *  The purpose of this structure is to map events to entities and handle them indipendently.
 */
/*
    app.loadEvents({
        
        'Pair': {
            abi: require('./abis/pair.json').abi,
            events: [
                { event: 'Swap' },
                { event: 'Transfer'},
                { event: 'Sync' },
                { event: 'Burn' }
            ]
        },
        'Factory': {
            abi: require('./abis/Factory.json'),
            events: [ 
                { 
                    event: 'PairCreated',
                    handler: (l: Listener, e: any) => {
                        //console.log(`${Colors.MAGENTA}[EVENT][${e.event}]: ${Object.keys(e.returnValues).filter(k => k.length > 1).map(k => { if( k.length > 1) return `${k}: ${e.returnValues[k]}` }).join(", ")}${Colors.RESET}`);
                        new Pair({address: e.returnValues.pair, network_id: app.network.db_id, created_at: new Date()})
                        .resolve(app.safe)
                        .then((p: Pair) => {
                            p.create(app.db)
                            .then(pairId => {
                                p.updateTvl({
                                    safe: app.safe,
                                    router: app.network.routers["quick"],
                                    db: app.db
                                }).then((tvl: number) => {
                                    console.log(`${Colors.MAGENTA}[PAIR] ${p.shape.token0}/${p.shape.token1} deployed on ${p.shape.factory} and stored with id=${pairId} and TVL=${tvl}$ ${Colors.RESET}`);
                                });
                                
                                Token.get(app.db,`address="${e.returnValues.token0}" OR address="${e.returnValues.token1}"`)
                                .then( token => {
                                    if(token !== null){
                                        console.log(`${Colors.MAGENTA}[PAIR] ${e.returnValues.pair} disovered for token ${token.id} and stored with id=${pairId}`);
                                        token.markAsSelected(app.db)
                                        .then(t => {
                                            console.log(`${Colors.MAGENTA}[TOKEN] ${t.id} marked.`);
                                        });
                                    }else{
                                        if(!l.safe.w3) return;
                                        let web3 = l.safe.w3;
                                        if(p.shape.factory){
                                            new web3.eth.Contract(Token.ABI, p.shape.token0).methods.symbol().call()
                                                .then((s0: string) => {
                                                    new web3.eth.Contract(Token.ABI, p.shape.token1).methods.symbol().call()
                                                    .then((s1: string) => {
                                                        console.log(`${Colors.MAGENTA}[PAIR] ${s0}/${s1} deployed on ${p.shape.factory} and stored with id=${pairId}${Colors.RESET}`);
                                                    });
                                                });
                                            Factory.get(app.db,p.shape.factory)
                                            .then((factory) => {
                                                let factoryName = (factory) ? factory.name : p.shape.factory;
                                                new web3.eth.Contract(Token.ABI, p.shape.token0).methods.symbol().call()
                                                .then((s0: string) => {
                                                    new web3.eth.Contract(Token.ABI, p.shape.token1).methods.symbol().call()
                                                    .then((s1: string) => {
                                                        console.log(`${Colors.MAGENTA}[PAIR] ${s0}/${s1} deployed on ${factoryName} and stored with id=${pairId}${Colors.RESET}`);
                                                    });
                                                });
                                            });
                                        }
                                    }
                                });
                                
                            });
                        });
                    }
                }
            ]
        },
        'MasterChef': {
            abi: require('./abis/masterchef.json'),
            events: [ 
                {  event: 'AddPool' },
                {  event: 'Withdraw' },
                {  event: 'Deposit' },
            ]
        }  
    });
*/

app.loadEvents({
        
    'Pair': {
        abi: require('./abis/pair.json').abi,
        events: [
            { 
                event: 'Swap',
                handler: () => {

                }   
            },
            { event: 'Transfer'},
            { event: 'Sync' },
            { event: 'Burn' }
        ]
    }
});

/* 
 *  Clock Methods are scheduled tasks, they are fired by the App Clock every x milliseconds.
 *  You can run as many clock methods you need, but always considering your computer resources...
 *  A clock method is represented as below:
 *  {
 *      name: string,
 *      fn: async (): Promise<void>,
 *      thick: number
 *  }
 *  where: 
 *        name: is an alias for logging
 *        fn: is the handler function
 *        thick: is the delay expressed in milliseconds
 */
