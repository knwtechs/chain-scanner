const config = {
    log: false,
    resolver: {
        chunk_size: 100
    },
    db: {
        host: "localhost",
        user: "root",
        password: "",
        database: ""
    },
    network: 'ether',
    networks: require('./networks').networks,
    mailer: {
        host: 'smtp.gmail.com',
        port: 465,
        username: '',
        password: '',
        useTLS: true,
        useSSL: true,
        logger: false
    }
}

module.exports = { config };