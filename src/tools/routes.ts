import { IConfig } from '../interfaces';
import { SafeWeb3 } from '../class/base';
import { Network } from '../class/models';
import { AbiItem } from 'web3-utils';
import { getPrice, getCostantProduct, getPairAddresOffChain } from '../class/utils';
import Web3 from 'web3';

const fs = require("fs");
const readline = require('readline');
const config :IConfig = require('../config/config.js').config;
let net :Network | undefined = config.networks.find( el => el.name == config.network);
if(net === undefined){ console.log("Wrong Network."); process.exit(); }
const safe :SafeWeb3 = new SafeWeb3({ network: new Network(net) });
const factory_abi: AbiItem[] = require('../abis/factory.json') as AbiItem[];
const pair_abi: AbiItem[] = require('../abis/pair.json').abi as AbiItem[];
const factory_address = "0xc35DADB65012eC5796536bD9864eD8773aBc74C4";

type Pair = { a: string; b: string; };

class Queue<T> {
    data: T[] = [];
    enqueue = (v: T): void => {
        this.data.push(v);
    }
    dequeue = (): T | undefined => {
        return this.data.shift();
    }
    isEmpty = (): boolean => {
        return this.data.length === 0;
    }
};

class Node {
    address: string;
    constructor(address: string){
        this.address = address;
    }
}
type Path = Node[];

class Graph {
    
    nodesCount: number;
    edgesCount: number;
    adj: Map<Node, [Node, number][]>;
    nodesMap: Map<string, Node>;
    pairs: Pair[];

    constructor(){
        this.nodesCount = 0;
        this.edgesCount = 0;
        this.adj = new Map<Node, [Node, number][]>();
        this.nodesMap = new Map<string, Node>();
        this.pairs = [];
    }

    addNode(v: Node): Node {

        if(!this.adj.has(v)){
            this.adj.set(v, []);
            this.nodesCount++;
        }
        return v;

    }

    addEdge(v: Node, w: Node, weight: number): void{
        this.adj.get(v)?.push([w, weight]);
        this.adj.get(w)?.push([v, weight]);
        this.edgesCount++;
    }

    print(): void {
        var get_keys = this.adj.keys();
        for (let n of get_keys)
        {
            var get_values = this.neighbors(n);
            var conc = "";   
            if(get_values){
                for (let e of get_values)
                    conc += `${e[0].address}(${e[1]}) `;
            }
            console.log(n.address + " -> " + conc);
        }
    }

    bfs(start: Node): void
    {

        var visited = new Map<Node, boolean>();
        var q = new Queue<Node>();

        visited.set(start, true);
        q.enqueue(start);

        while (!q.isEmpty()) {

            var getQueueElement = q.dequeue();
            if(!getQueueElement) continue;

            console.log(getQueueElement.address);
            var get_List = this.neighbors(getQueueElement);
            if(get_List){
                for (let neigh of get_List) {
                    if (!visited.get(neigh[0])) {
                        visited.set(neigh[0], true);
                        q.enqueue(neigh[0]);
                    }
                }
            }
        }
    }

    dfs(start: Node): void
    {
        const DFSUtil = (vert: Node, visited: Map<Node, boolean>) => {
            visited.set(vert, true);
            console.log(vert.address);
    
            var neighbours = this.neighbors(vert);
            if(neighbours){
                for (var n of neighbours) {
                    if (!visited.get(n[0]))
                        DFSUtil(n[0], visited);
                }
            }
        }

        var visited = new Map<Node, boolean>();
        DFSUtil(start, visited);
    }

    neighbors(node: Node): [Node, number][] {
        let neighbors = this.adj.get(node);
        if(neighbors) return neighbors;
        else return [];
    }

    nodeOf(address: string): Node | undefined {
        return this.nodesMap.get(address);
    }

    sub(src: string, dest: string): Graph {
        let g = Graph.load(this.adj, this.nodesCount, this.edgesCount);
        g.adj.forEach( (v: [Node, number][], k: Node, map: Map<Node, [Node, number][]>) => {
            // TODO
        });
        return g;
    }

    dijkstra(source: Node, dest: Node) {
        console.time('Dijkstra');

        const vertexWithMinDistance = (distances: { [key: string]: number }, visited: Set<string>): Node | null => {

            let minDistance = Infinity,
                minVertex = null;

            for (let vertex in distances) {
                let distance = distances[vertex];
                if (distance < minDistance && !visited.has(vertex)) {
                    minDistance = distance;
                    minVertex = vertex;
                }
            }

            if(minVertex)
                return this.nodeOf(minVertex) ?? null;
            else
                return null;

        }

        let distances: { [key: string]: number } = {},
            parents: {[key: string]: Node | null} = {},
            visited = new Set<string>();
        
        for (let v of this.nodesMap.values()) {
            if (v === source)
                distances[source.address] = 0;
            else
                distances[v.address] = Infinity;
            
            parents[v.address] = null;
        }
        
        let currVertex = vertexWithMinDistance(distances, visited);

        while (currVertex !== null) {
            let distance = distances[currVertex.address],
                neighbors = this.neighbors(currVertex);
            
            for (let neighbor of neighbors) {
                let newDistance = distance + neighbor[1];
                if (distances[neighbor[0].address] > newDistance) {
                    distances[neighbor[0].address] = newDistance;
                    parents[neighbor[0].address] = currVertex;
                }
            }
            visited.add(currVertex.address);
            currVertex = vertexWithMinDistance(distances, visited);
        }

        let shortestPath = [dest];
        let parent = parents[dest.address];
        while (parent) {
            shortestPath.push(parent);
            parent = parents[parent.address];
        }
        shortestPath.reverse();

        console.timeEnd('Dijkstra');
        return shortestPath;
    }

    getAllPaths(s: Node, d: Node, path: Path = [], maxPathLength = 0) {

        console.log("allPaths()");
        console.time("allPaths");

        const hasEdgeBeenFollowedInPath = ({from, to}: {from: Node, to: Node}, path: Path) => {
            for(let a of this.neighbors(from)){
                for(let i = 0; i < path.length; i++){
                    if(path[i+1] === to)
                        return true;
                }
            }
            return false;
        }

        const explore = (currNode: Node, to: Node, paths: Path[] = []): Path[] => {
            path.push(currNode);
            if(maxPathLength > 0 && path.length < maxPathLength){
                for (let linkedNode of this.neighbors(currNode)) {
                    if (linkedNode[0] === to) {
                        let result = path.slice(); // copy values
                        result.push(to);
                        paths.push(result);
                        continue;
                    }
                    // do not re-explore edges
                    if (!hasEdgeBeenFollowedInPath({ from: currNode, to: linkedNode[0] }, path )) {                    
                        explore(linkedNode[0], to, paths);
                    }
                    
                }
            }
            path.pop(); // sub-graph fully explored            
            return paths;
        }

        return explore(s,d);
    }

    async findPair(a: string, b: string): Promise<string | undefined> {
        if(safe.w3){
            let factory = new safe.w3.eth.Contract(factory_abi, factory_address);
            return await factory.methods.getPair(a,b).call();
        }
    }

    async weight(): Promise<Graph> {
        console.log("Weighting...");
        console.time('Weighting');
        if(!safe.w3) throw new Error("SAFEWEB3 DOWN");
        for(let from of this.nodesMap.values()){
            let all_to = this.neighbors(from);
            for(let i = 0; i < all_to.length; i++){

                if(all_to[i][1] > 0) continue;

                // Update FROM -> TO
                let K = await getPrice({w3: safe.w3, router_address: safe.network.routers["quick"], path: [from.address, all_to[i][0].address]});
                all_to[i][1] = 1-Number(K);

                // Update TO -> FROM
                let to_as_node = this.nodeOf(all_to[i][0].address);
                if(to_as_node){
                    let coll = this.adj.get(to_as_node);
                    if(coll){
                        coll.map((el, idx) => {
                            if (el[0] === all_to[i][0])
                                el[1] = all_to[i][1]                 
                        });
                    }
                }
            }
        }
        console.timeEnd('Weighting');
        return this;
    }

    async getPathWithMaxReserves(paths: Path[]): Promise<Path> {
        
        const getPathWithMaxReservesUtil = async (path: Path): Promise<number[]> =>  {
            if(safe.w3){
                let numbers: number[] = [];
                for(let i=1; i < path.length; i++){
                    let pair_addr = getPairAddresOffChain(safe.w3, factory_address, path[i-1].address, path[i].address);
                    if(pair_addr !== undefined){
                        let p = { a: path[i-1].address,  b: path[i].address, p: pair_addr};
                        let cProduct = await getCostantProduct({ w3: safe.w3, pair: p});
                        numbers.push(cProduct);
                    }
                }
                return numbers;
            } return [];
        }

        let data: {
            path: Path,
            candidates: number[]
        }[] = [];

        for(let p of paths){
            let n: number[] = await getPathWithMaxReservesUtil(p);
            data.push({path: p, candidates: n});
        }

        return data.sort( (a,b) => {
            let len = a.candidates.length >= b.candidates.length ? a.candidates.length : b.candidates.length;
            for(let i = 0; i<len; i++){
                if(a.candidates[i] != b.candidates[i])
                    return a.candidates[i] - b.candidates[i];
            }
            return a.candidates[0] - b.candidates[0];
            /*if (a.candidates[0] == b.candidates[0]) {
                return a.candidates[1] - b.candidates[1];
            }
            return b.candidates[0] - a.candidates[0];*/
        })[0].path ?? [];
    }

    static build (safe: SafeWeb3, pairs: Pair[]): Graph {

        console.time('buildGraph')
        if(!safe.w3) throw new Error('SAFEWEB3 DOWN');
        
        let g = new Graph;
        g.pairs = pairs;
        for(let p of pairs){
            try{
                let a = new Node(p.a);
                let b = new Node(p.b);

                if(!g.nodesMap.has(p.a)){
                    g.nodesMap.set(p.a, a);
                    g.addNode(a);
                }

                if(!g.nodesMap.has(p.b)){
                    g.nodesMap.set(p.b, b);
                    g.addNode(b);
                }

            }catch(err){
                console.log("PAIR ERR %s", err);
            }
        }

        for(let i = 0; i < pairs.length; i++){
            try{
                let a = g.nodesMap.get(pairs[i].a);
                let b = g.nodesMap.get(pairs[i].b);
                if(a && b) g.addEdge(a, b, 0);
                process.stdout.write(`Preparing: ${Number(i / (pairs.length - 1) * 100).toFixed(4)}\% (${i}/${pairs.length -1})\r`);
            }catch(err){
                console.log("PAIR ERR %s", err);
            }
        }
        console.log("");
        console.timeEnd('buildGraph')
        return g;
    }

    static load( data: Map<Node, [Node, number][]>, nodes: number, edges: number){
        let g = new Graph();
        g.adj = data;
        g.nodesCount = nodes;
        g.edgesCount = edges;
        return g;
    }
}

class PairSource {

    static storage_file: string = 'pairs.txt';

    static async fetchPairs (w3: Web3) {
        var file = fs.createWriteStream(PairSource.storage_file);
        file.on('error', (err: string) => { console.log(err); });
        console.time('fetchPairs')
    
        let factory = new w3.eth.Contract(factory_abi, factory_address);
        let pairs_count: number = Number(await factory.methods.allPairsLength().call());
    
        for(let i = 0; i < pairs_count; i++){
            try{
                process.stdout.write(`Fetching Pairs: ${Number(i / pairs_count * 100).toFixed(2)}\% (${i}/${pairs_count-1})\r`);
                let p = await factory.methods.allPairs(i).call();
                let p_contract = new w3.eth.Contract(pair_abi, p);
                let t0 = await p_contract.methods.token0().call();
                let t1 = await p_contract.methods.token1().call();
                file.write(`${t0},${t1}\n`);
            }catch(err){
                console.log("PAIR ERR %s", err);
            }
        }
    
        file.end();
        console.timeEnd('fetchPairs');
    }
    
    static async loadPairs(limit: number = 0): Promise<Pair[]> {
        if(!safe.w3) return [];
        if (!fs.existsSync(PairSource.storage_file)) await this.fetchPairs(safe.w3);
        
        let pairs: { a: string; b: string; }[] = [];
        const fileStream = fs.createReadStream(PairSource.storage_file);
        const rl = readline.createInterface({
          input: fileStream,
          crlfDelay: Infinity
        });
        
        let c = 0;
        for await (const line of rl) {
            if(limit > 0 && c >= limit) break;
            let [t0,t1] = String(line).split(',');
            pairs.push({ a: t0.trim(), b: t1.trim() });
            c++;
        }
        console.log("%s pairs loaded.", pairs.length);
        return pairs;
    }
}

if(safe.load()){
    PairSource.loadPairs()
    .then((pairs: { a: string; b: string; }[]) => {

        let g: Graph = Graph.build(safe, pairs);
        //g.print();
        let from = g.nodeOf("0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270");
        let to = g.nodeOf("0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063");
        if(from && to){
            let d = g.dijkstra(from, to);
            console.log(d);
            let paths = g.getAllPaths(from, to, [], 4);
            console.timeEnd("allPaths");
            console.log(paths);
            console.log(`Routes: ${paths.length} routes found [${from.address} -> ${to.address}]`);
            let optimal = g.getPathWithMaxReserves(paths);
            console.log("Optimal Route: %s", optimal);
            process.exit();
        }
        /*g.print();
        console.log("Edges count %s",g.edgesCount);
        console.log("Nodes count %s",g.nodesCount);
        process.exit();*/
        /*let from = g.nodeOf("0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270");
        let to = g.nodeOf("0x02677c45FA858B9fFec24fc791bF72cdf4A8A8Df");
        if(from && to) {
            let paths = g.getAllPaths(from, to);
            console.log(paths);
            process.exit();
        }*/
        /*g.weight()
        .then((g: Graph) => {
            let from = g.nodeOf("0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270");
            let to = g.nodeOf("0x02677c45FA858B9fFec24fc791bF72cdf4A8A8Df");
            if(from && to) {
                let route = g.dijkstra(from, to);
                console.log(route);
            }
        })
        .then(() => {
            console.log("Edges count %s",g.edgesCount);
            console.log("Nodes count %s",g.nodesCount);
            process.exit();
        });*/
        
        //g.print();
        //g.bfs(n);
        
    });
}











