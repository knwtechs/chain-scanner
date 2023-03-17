import { IConfig } from '../interfaces';
import { Database, SafeWeb3, Arbiter } from '../class/base';
import { Network } from '../class/models';
import { Colors } from '../class/utils';

const config :IConfig = require('../config/config.js').config;
const arbiterConfig = require('../config/arbiter.js').arbiterConfig;
let net :Network | undefined = config.networks.find( el => el.name == 'polygon');
if(net === undefined){ console.log("Wrong Network."); process.exit(); }
const safe :SafeWeb3 = new SafeWeb3({ network: new Network(net) });

const db = new Database(config.db, true);
safe.load();
db.connect()
.then(() => {
    const arb = new Arbiter({
        safe: safe,
        db: db,
        config: arbiterConfig
    });

    arb.play().then(() => {
        process.exit();
    });
})








