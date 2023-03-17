import { Database } from "../base";
import { FormalEntity } from "../entities";
import { Network } from "../models";

export abstract class Runner<T extends FormalEntity> {

    subject: T;
    db: Database;
    network: Network;

    constructor({sub, db, network}: {sub: T, db: Database, network: Network}){
        this.subject = sub;
        this.db = db;
        this.network = network;
    }

    abstract run(): void;
}