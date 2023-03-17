const arbiterConfig = {
    tokens: {
        'polygon': [
            {
                name: 'WMATIC',
                address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
                decimals: 18
            },
            {
                name: 'WBTC',
                address: '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6',
                decimals: 8
            },
            {
                name: 'WETH',
                address: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
                decimals: 18
            },
        ],
        'ether': [],
        'bsc': []
    },
    config: [
        {
            factory: '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32', // QuickFactory
            router: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff' // QuickRouter
        },
        {
            factory: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4', // SushiV2Factory
            router: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506' // SushiV2Router
        }
    ]
}

module.exports = { arbiterConfig };