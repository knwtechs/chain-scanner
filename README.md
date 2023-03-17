# evm-monitor
#### <code>evm-monitor</code> is a framework that allows to easily code event-based programs listening an arbitrary EVM compatible blockchain.
#### It can be used to perform real time monitoring, history searchs, information gathering and many more cases.
#### I won't add tons of docs just because i've no time for this at all - unfortunately - but i'll try my best.

# Build 
#### <code>npm run build</code> for building a production build.

#### Project settings are located in config/config.js:

```json
const config = {
    log: false,
    resolver: {
        chunk_size: 100
    },
    db: {
        host: "<YOUR_DBADDR_HERE>",
        user: "<YOUR_DBUSER_HERE>",
        password: "<YOUR_PASSWORD_HERE>",
        database: "<YOUR_DBNAME_HERE>"
    },
    network: "<choose one from config/networks.js>",
    networks: require('./networks').networks,
    bscscan_key: "<YOUR_BSCSCAN_APIKEY_HERE>"
}
```
</code>

## Just a few things before you dive into the code

### Migrations
```src/migrations/*```
##### Migrations are useful when working with databases. Extending a Migration object you can easily create, delete and update tables.
##### Take a look to ```src/migrations/CreateNetworkTable.ts``` to understand them deeply.
##### Running the command <code>npm run migrate</code> will execute all the migrations objects contained in ```src/migrations```.

### Scanner
```src/class/base/Scanner.ts```
##### This is the entry point of the whole application.
##### Its constructor signature is:
```
constructor({safe, db, network, log, filterRules} :{
    safe: SafeWeb3;
    db: Database,
    network: Network,
    log: boolean;
    filterRules: FilterRulesItem[]
})
 ```
 
##### The Scanner class expose the <code>init</code> method, that requires an <code>FnScan</code> function.
##### The FnScan function will be called on each tx that the chain will validate.
 
### ContractFilter
```src/class/base/ContractFilter.ts```
##### Decision Tree implementation to recognize a contract type. 
##### Its constructor signature is:
```
constructor(web3: SafeWeb3){
    this.safe = web3;
    this.rules = { items: new Array<FilterRulesItem>() };
}
 ```
 
##### Where <code>rules</code> parameter contains all the contract rules.
##### Contract rules are placed in entity classes in an attribute named <code>filterRules</code>
##### For example, <code>Pair</code> entity has the follow filterRules:
```
static filterRules: FilterRulesItem = {
    rule: 'factory()',
    for: 'Pair',
    next: {
        rule: 'MINIMUM_LIQUIDITY()',
        for: 'Pair',
        next: {
            rule: 'totalSupply()',
            for: 'Pair',
            next: {
                rule: 'decimals()',
                for: 'Pair'
            }
        }
    }
};
 ```
#### IMPORTANT CONSIDERATIONS
##### The order of <code>ContractFilter.rules</code> is very important, because of they'll be computed from the 0th element to the last one.
##### If each rule of <code>ContractFilter.rules</code> returns true, then the contract is successfully identified.
##### Note that also the <code>FilterRulesItem</code> s are sorted:  the (i+1)-th rule is considered only if the i-th rule exited on a false return.

### SafeWeb3
```src/class/base/SafeWeb3.ts```
##### It handles the connection with the blockchain using wss, and errors too.
##### Its constructor signature is:
```
constructor({
  network,
  secret
}: {
  network :Network,
  secret? :string
})
 ```

### Entity
```src/class/base/Entity.ts```
##### It is the base class to represent entities. 
##### As example ERC721, ERC1155, ERC20 are entities. New entities can be created extending the base class Entity. 
##### Its constructor signature is:
```
constructor({
    shape,
    abi,
    required,
    table
}: {
    shape: T;
    abi: AbiItem[],
    required: Array < keyof T > ,
    table: string
})
```