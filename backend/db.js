const { Pool } = require('pg');

// **本地 PostgreSQL 连接信息**
const pool = new Pool({
    user: "postgres",
    host: 'localhost',
    database: 'mt5_database',
    password: '4869',
    port: 5432,
});

module.exports = pool;
