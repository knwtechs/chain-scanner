const networks = [
    {
        name: 'bsc',
        db_id: 1,
        wss: [
            //"wss://bsc.getblock.io/mainnet/",
            "https://bsc-dataseed1.defibit.io/"
        ],
        id: "56",
        scan_api: "" // bscscan apikey
    },
    {
        name: 'ether',
        db_id: 3,
        wss: [
            //"wss://bsc.getblock.io/mainnet/",
            //"wss://mainnet.infura.io/ws/v3/673bcdfea03546aa831b0345a6e414bc",
            "ws://127.0.0.1:3334"
        ],
        id: "1",
        scan_api: "" // etherscan apikey
    },
    {
        name: 'polygon',
        db_id: 2,
        wss: [
            //"wss://rpc-mainnet.matic.network",
            //"wss://ws-matic-mainnet.chainstacklabs.com",
            "wss://rpc-mainnet.matic.quiknode.pro",
            "wss://matic-mainnet-full-ws.bwarelabs.com"
        ],
        id: "137",
        scan_api: "", // polygon apikey
        routers: {
            "quick": "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff"
        },
        common: {
            "USDC": "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
            "WMATIC": "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270"
        }
    }
];

module.exports = { networks };