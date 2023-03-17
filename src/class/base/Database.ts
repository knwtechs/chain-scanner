import {createConnection, Connection, format, QueryError, RowDataPacket, FieldPacket, ResultSetHeader} from 'mysql2/promise';
import { Colors } from '../utils';

export interface DBCredentials {
    host :string;
    user: string;
    password: string;
    database: string;
}

export class Database {

    host :string;
    user: string;
    password: string;
    name: string;

    db: Connection | null;
    error: QueryError | null;

    constructor(params: DBCredentials, lazyLoad?: boolean){
        this.host = params.host;
        this.user = params.user;
        this.password = params.password;
        this.name = params.database;
        this.db = null;
        this.error = null;
        if(!lazyLoad){
            this.connect().then( () => {
                console.log(`${Colors.BRIGHT_BLUE}[DATABASE] MySQL Connected.${Colors.RESET}`);
            });
        }
    }

    get connection() :Connection | null {
        return this.db != null ? this.db : null;
    }

    get f() :Function {
        return format;
    }

    async connect() :Promise<void> {
        this.db = await createConnection({
            host: this.host,
            user: this.user,
            password: this.password,
            database: this.name,
            multipleStatements: true
        });
        console.log(`${Colors.BRIGHT_BLUE}[DATABASE] MySQL Connected.${Colors.RESET}`);
    }


    async query(query :string) :Promise<RowDataPacket[] | null> {
        if(this.db != null){
            let [r,f] :[RowDataPacket[], FieldPacket[] ] = await this.db.query<RowDataPacket[]>(query);
            return r;
        }
        return null;
    }

    async insert(query :string) :Promise<number | null> {
        if(this.db != null){
            let [r,f] : [ResultSetHeader, any] = await this.db.query(query);
            return r.insertId;
        }
        return null;
    }

}