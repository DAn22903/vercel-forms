require('dotenv').config();

const { readFile } = require('node:fs/promises');
const path = require('node:path');
const pool = require('../config/db');

const requiredEnvironment = ['DB_HOST', 'DB_USER', 'DB_PASSWORD'];
const missingEnvironment = requiredEnvironment.filter((key) => !process.env[key]);

async function initializeDatabase() {
  try {
    if (missingEnvironment.length) {
      throw new Error(`Faltan variables de entorno requeridas: ${missingEnvironment.join(', ')}`);
    }

    const schema = await readFile(path.join(__dirname, '..', 'database', 'schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('Tabla solicitudes_empleo lista.');
  } finally {
    await pool.end();
  }
}

initializeDatabase().catch((error) => {
  console.error('No se pudo inicializar la base de datos:', error);
  process.exitCode = 1;
});
