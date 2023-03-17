import { Database, DBCredentials, Migrator, Migration } from '../class/base';
import migrations from '../migrations';

const migrate = () => {
    const db_credentials :DBCredentials = require('./config/config.js').config.db;
    const db :Database = new Database(db_credentials, true);
    const items: Migration[] = [];
    for(let x of migrations)
        items.push(new x);

    db.connect().then(() => { 
        Migrator.run(db, items);
        process.exit();
    });
}

migrate();
