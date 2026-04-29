const {Pool} = require('pg')
const pool = new Pool({
    user: 'postgres',
    host:'localhost',
    database: 'esmearthur-aidoo',
    password: 'Esmeaa101!',
    port: 5433.
})

module.exports = pool