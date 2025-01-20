require('dotenv').config(); // ***LÍNEA CRUCIAL: Carga las variables de entorno***
require('dotenv').config();
const sql = require('mssql');

const dbConfig = {
  user: process.env.DB_USER, // Usuario desde .env
  password: process.env.DB_PASSWORD, // Contraseña desde .env
  server: process.env.DB_HOST, // Servidor desde .env
  database: process.env.DB_NAME, // Base de datos desde .env
  options: {
    trustServerCertificate: true
  }
};

let pool;

async function connectToDatabase() {
  try {
    if (!pool) {
      pool = await sql.connect(dbConfig); // Establecer pool de conexión
      console.log('Conexión a la base de datos establecida.');
    }
    return pool; // Devuelve el pool de conexión
  } catch (err) {
    console.error('Error al conectar a la base de datos:', err);
    throw err;
  }
}

module.exports = { connectToDatabase, sql };
