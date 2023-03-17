import { IConfig } from '../interfaces';
import { Database, SafeWeb3 } from '../class/base';
import { Network } from '../class/models';
import { Pair, MasterChef, ERC721, ERC1155, ERC20 } from '../class/entities';
import { Colors } from '../class/utils';

const config :IConfig = require('../config/config.js').config;
let net :Network | undefined = config.networks.find( el => el.name == config.network);
if(net === undefined){ console.log("Wrong Network."); process.exit(); }
const safe :SafeWeb3 = new SafeWeb3({ network: new Network(net) });

type Counters = {
    [key: string]: number
}

const count = async (db: Database, just_24h: boolean = false) => {

    let counters: Counters = {
        erc721: 0,
        erc1155: 0,
        erc20: 0,
        masterchef: 0,
        pair: 0
    };

    counters.erc721 = await ERC721.count(db, ERC721.table, just_24h);
    counters.erc1155 = await ERC1155.count(db, ERC1155.table, just_24h);
    counters.erc20 = await ERC20.count(db, ERC20.table, just_24h);
    counters.pair = await Pair.count(db, Pair.table, just_24h);
    counters.masterchef = await MasterChef.count(db, MasterChef.table, just_24h);

    return counters;
}

const rates = async (db: Database) => {
    let _rates = await count(db, true);
    _rates.erc721_rate = _rates.erc721 > 0 ? (_rates.erc721 / 24) : 0;
    _rates.erc1155_rate = _rates.erc1155 > 0 ? (_rates.erc1155 / 24) : 0;
    _rates.erc20_rate = _rates.erc20 > 0 ? (_rates.erc20 / 24) : 0;
    _rates.pair_rate = _rates.pair > 0 ? (_rates.pair / 24) : 0;
    _rates.masterchef_rate = _rates.masterchef > 0 ? (_rates.masterchef / 24) : 0;
    return _rates;
}

const displayRates = (rate: Counters) => {
    for( let x in rate) {
        if(x.includes('_rate'))
            console.log(`${Colors.BRIGHT_MAGENTA}${x.substring(0,x.length-5)}${Colors.RESET}: ${rate[x].toFixed(3)}/hour {${rate[x.substring(0,x.length-5)]}}`);
    }
}

const db = new Database(config.db, true);
db.connect()
.then(() => {
    count(db)
    .then((counts) => {
        //console.log(counts);
        rates(db)
        .then((rate) => {
            displayRates(rate);
            process.exit();
        })
    })
})








