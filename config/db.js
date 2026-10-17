const mysql = require('mysql2/promise');

const sslSetting = (process.env.DB_SSL || 'true').toLowerCase();
if (!['true', 'false', '1', '0'].includes(sslSetting)) {
  throw new Error('DB_SSL debe ser true, false, 1 o 0.');
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'defaultdb',
  ssl: ['true', '1'].includes(sslSetting) ? { rejectUnauthorized: false } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
