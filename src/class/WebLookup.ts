//const gsearch = require('google-it')
//const cheerio = require("cheerio");

import axios from 'axios';
import {UserAgent} from 'user-agents';

const { delay, strarraycompare, strcompare, get_host_from_url } = require('../utils/utils');

class WebLookup {

    static test = async (name, network, debug = false) => {
        const instance = new WebLookup({medium: true, website: true, docs: true, network: network});
        instance.key = name;
        if(debug === true)
            instance.debug = true;
        instance.lookup(name).then( (r) => {
            console.log(r);
        });
    }

    constructor({network, medium, website, docs}={}){

        if(network === undefined)
            throw 'You must provide a network for the WebLookup';

        this.lastReqTS = undefined;
        this.reqDelay = 5 * 1000; // 3 seconds
        this.minScore = 0.4;
        this.try_medium = medium !== undefined ? medium : false;
        this.try_docs = docs !== undefined ? website : false;
        this.network = network;
        this.name = "";
        this.debug = false;
        this.uaManager = new UserAgent();
        this.reqOptions = {
            headers: {
                "User-Agent": this.uaManager.random().toString(),
            }
        };
        this.results = {};
    }

    set medium(b){ this.try_medium = b; }
    set docs(b){ this.try_docs = b; }
    set key(k) { this.name = k.toLowerCase(); }
    set log(b) { this.debug = b; }

    get medium() {
        
        return ( async () => {
            if(this.debug === true)
                console.log("Medium(): Searching for: " + this.name);

            if(this.data === null) return null;

            if(this.debug === true)
                console.log("Medium(): fetched.");

            let sel_candidates = this.data.map( (i) => { 
                return get_host_from_url(i.url);
            }).filter((x) => {
                return x.includes('medium.com');
            });

            let [x, v] = strarraycompare(this.name, sel_candidates);
            
            if(this.debug === true)
                console.log("Medium(): done: "+x)
            
            this.results.medium = x;
            return x;
        })();
    }

    get website() {

        return ( async () => {

            if(this.debug === true)
                console.log("Website(): Searching for: "+this.name);

            if(this.data === null) return null;

            if(this.debug === true)
                console.log("Website(): fetched.");

            let sel_candidates = this.data.map( (i) => { 
                return get_host_from_url(i.url);
            });

            if(this.debug === true)
                console.log("Website(): comparing...");

            let [x, v] = strarraycompare(this.name, sel_candidates);
            
            if(this.debug === true)
                console.log("Website(): done: " + x);
            
            this.results.website = (v > this.minScore) ? x : null;
            return this.results.website;
        })();
    }

    get docs() {

        return ( async () => {

            if(this.debug === true)
                console.log("Docs(): Searching for: " + this.name);

            if(this.data === null) return null;

            if(this.debug === true)
                console.log("Docs(): fetched.");

            let sel_candidates = this.data.map( (i) => { 
                return get_host_from_url(i.url);
            }).filter((x) => {
                return x.includes('docs') || x.includes('gitbook.io');
            });
            

            let [x, ] = strarraycompare(this.name, sel_candidates);
            
            if(this.debug === true)
                console.log("Docs(): done: "+x)
            
            this.results.docs = x;
            return x;
        })();
    }

    fetch = async () => {
        this.data = await this.__search([this.name, this.net].join(" "), 100);
    }

    lookup = async () => {

        await this.fetch();

        await this.website;

        if(this.try_medium)
            await this.medium;
        
        if(this.try_docs)
            await this.docs;
        
        return this.results;

    }

    __wait = async () => {

        if(this.lastReqTS === undefined || (Date.now() - this.lastReqTS > this.reqDelay) ){
            this.lastReqTS = Date.now();
            return;
        }
        await delay(this.reqDelay - (Date.now() - this.lastReqTS));
        this.lastReqTS = Date.now();
        return;
    }

    __search = async (q, limit=1) => {

        await this.__wait();

        try{

            let r = await axios.get( 'https://app.scrapingbee.com/api/v1/store/google', {
                params: {
                    'api_key': '8XBBXBM9GB5HBZ5WEK6EEEBI5ZCH3ZYMSCOIPY8UE3D3N7T586PSBW17NMVVBULP9520WFD8335OR6RB',
                    'search': q 
                }
            });

            let d = r.data.organic_results.map( (i) => { return {url: i.url, title: i.title, description: i.description}; });

            return (limit > 1) ? d : d[0];
            
        }catch(e) {

            if(this.debug)
                console.log(e.toString());

            return [];
        }

    }

}

WebLookup.test("Polycrystal", "polygon", true);

module.exports = { WebLookup };