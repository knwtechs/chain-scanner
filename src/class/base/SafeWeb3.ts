import { Network } from '../models';
import Web3 from 'web3';
import { Providers } from 'web3-core';
import { Colors } from '../utils';

export class SafeWeb3 {

    static TIMEOUT: number = 10 * 1000;
    static RELOAD: boolean = true;
    static DOWNERROR: string = `${Colors.RED}[SAFEWEB3] Down.${Colors.RESET}`;
    network :Network;
    secret :string | undefined;
    options :Object;
    last_provider_id :number;
    web3 :Web3 | undefined;
    admin_account :string | undefined;
    wsprovider :InstanceType<Providers["WebsocketProvider"]> | null;
    reload_attempt: number;

    constructor({network, secret} :{network :Network, secret? :string}) {

        this.options = {
            timeout: SafeWeb3.TIMEOUT, // ms
            clientConfig: {
                // Useful if requests are large
                maxReceivedFrameSize: 100000000,   // bytes - default: 1MiB
                maxReceivedMessageSize: 100000000, // bytes - default: 8MiB
        
                // Useful to keep a connection alive
                keepalive: true,
                keepaliveInterval: -1 // ms
            },
            // Enable auto reconnection
            reconnect: {
                auto: true,
                delay: 1000, // ms
                maxAttempts: 8,
                onTimeout: false
            }
        };

        this.last_provider_id = 0;
        this.reload_attempt = 0;
        this.network = network;
        this.secret = secret ?? undefined;
        this.admin_account = undefined;
        this.wsprovider = null;
    }

    get currentProvider(): string {
        return this.network.wss[this.last_provider_id];
    }


    /**
     *  load a new web3 instance
     *
     * @returns true if succeeds
     *
     */
    load = () :boolean => {

        try{

            this.wsprovider = new Web3.providers.WebsocketProvider(this.network.wss[0], this.options);
            this.web3 = new Web3(this.wsprovider);
            this.web3.eth.handleRevert = true;

            if(this.secret != undefined)
                this.admin_account = this.web3.eth.accounts.wallet.add(this.secret).address;
            
            console.log(`${Colors.BRIGHT_BLUE}[SAFEWEB3] Data from ${this.network.wss[this.last_provider_id]}.${Colors.RESET}`);
            return true;

        }catch(err){

            console.log(`${Colors.RED}[SAFEWEB3] Cannot Instanciate SafeWeb3: ${err}${Colors.RESET}`);
            return false;
        }
    }

    /**
     *  Reload a web3 instance if down
     *
     * @param persistent - A boolean to tell the program if autoreload in case of service interruption
     *
     */
    reload = (persistent :boolean = true) :void => {

        try{
            let p = this.changeProvider();
            console.log(`${Colors.YELLOW}[SAFEWEB3] Connection attempt #${++this.reload_attempt} with ${p}${Colors.RESET}`);
            
        }catch(err){

            console.log(`${Colors.RED}[SAFEWEB3] Failed to connect to ${this.network.wss[this.last_provider_id]}${Colors.RESET}`);
            if(!persistent){
                console.log(`${Colors.RED}[SAFEWEB3] Cannot Instanciate Web3. Exit.${Colors.RESET}`);
                process.exit();
            }

            setTimeout( this.reload, SafeWeb3.TIMEOUT);
        }

    }

    /**
     *  change the provider for web3 instance
     *
     * @returns the new provider
     *
     */
    changeProvider = () :string => {
        let p: string = this.network.wss[ ++this.last_provider_id % this.network.wss.length ];
        this.wsprovider = new Web3.providers.WebsocketProvider(p, this.options);
        if(this.web3) this.web3.setProvider(this.wsprovider);
        else this.load()
        return p;
    }


    /**
     *  Getter for web3 instance
     *
     * @returns the web3 instance
     *
     * @beta
     */
    get w3() :Web3 | undefined {
        return this.web3;
    }

    /**
     *  Returns the account which is associated this web3 instance
     *
     * @returns the web3 instance
     *
     * @beta
     */
    admin = () :string | undefined=> {
        return this.admin_account;
    }

}