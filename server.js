require('dotenv').config(); // ***LÍNEA CRUCIAL: Carga las variables de entorno***
console.log("Valor de process.env.JWT_SECRET en server.js:", process.env.JWT_SECRET);
console.log("Longitud de process.env.JWT_SECRET:", process.env.JWT_SECRET.length); // NUEVO: Imprime la longitud
const express = require('express');
const app = express();
const WebSocket = require('ws');
const path = require('path');
const bcrypt = require('bcrypt');
const { connectToDatabase, sql } = require('./app/db');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { isAuthorized } = require('./auth/auth'); // Importa el middleware de autorización

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(cors());

// *** CONFIGURACIÓN DE CORS ***
const corsOptions = {
  origin: 'http://localhost:3000', // Reemplaza con el origen correcto de tu frontend
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions)); // Usa cors con las opciones configuradas


async function startServer() {
  try {
    const pool = await connectToDatabase();
    console.log('Conexión a la base de datos establecida.');

    const server = app.listen(3000, () => {
      console.log('Servidor HTTP escuchando en el puerto 3000.');
    });

// Configuración de WebSocket
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('Cliente WebSocket conectado.');

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message.toString()); // Convertimos el mensaje en JSON

            // Ejemplo de acción al recibir un mensaje
            if (data.type === 'register') {
                // Aquí manejas el registro de usuario como en tu código original
                const { nombre, email, password } = data;

                if (!nombre || !email || !password) {
                    return ws.send(JSON.stringify({ status: 'error', message: 'Faltan datos en el formulario.' }));
                }

                if (password.length < 8) {
                    return ws.send(JSON.stringify({ status: 'error', message: 'La contraseña debe tener al menos 8 caracteres.' }));
                }

                // Hasheamos la contraseña antes de guardarla
                const hashedPassword = await bcrypt.hash(password, 10);

                // Consulta SQL para insertar el usuario en la base de datos
                const request = new sql.Request(pool);
                request.input('NombreUsuario', sql.VarChar(50), nombre);
                request.input('CorreoElectronico', sql.VarChar(100), email);
                request.input('Contrasena', sql.VarChar(255), hashedPassword);

                const query = `
                    INSERT INTO Usuarios (NombreUsuario, CorreoElectronico, Contrasena)
                    VALUES (@NombreUsuario, @CorreoElectronico, @Contrasena)
                `;
                await request.query(query);

                ws.send(JSON.stringify({ status: 'success', message: 'Registro completado.' }));
            }

            // Otras acciones basadas en el tipo de mensaje
            else if (data.type === 'login') {
                // Lógica de login
                const { username, password } = data;

                if (!username || !password) {
                    return ws.send(JSON.stringify({ status: 'error', message: 'Faltan datos de inicio de sesión.' }));
                }

                const request = new sql.Request(pool);
                request.input('NombreUsuario', sql.VarChar(50), username);
                const query = `SELECT IdUsuario, Rol, Contrasena FROM Usuarios WHERE NombreUsuario = @NombreUsuario`;

                const result = await request.query(query);
                const user = result.recordset[0];

                if (!user) {
                    return ws.send(JSON.stringify({ status: 'error', message: 'Usuario no encontrado.' }));
                }

                const passwordMatch = await bcrypt.compare(password, user.Contrasena);
                if (!passwordMatch) {
                    return ws.send(JSON.stringify({ status: 'error', message: 'Credenciales inválidas.' }));
                }

                const payload = { userId: user.IdUsuario, role: user.Rol };
                const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

                ws.send(JSON.stringify({ status: 'success', message: 'Inicio de sesión exitoso.', token }));
            }

        } catch (error) {
            console.error('Error en WebSocket:', error);
            ws.send(JSON.stringify({ status: 'error', message: 'Error al procesar la solicitud.' }));
        }
    });

    ws.on('close', () => console.log('Cliente WebSocket desconectado.'));
    ws.on('error', (error) => console.error('Error en WebSocket:', error));
});

    app.get('/', (req, res) => {
      res.json({ message: 'Servidor funcionando' });
    });

    // Ruta de administración, con validación de permisos
        // *** RUTA PROTEGIDA ***
        app.get('/admin/usuarios', isAuthorized('admin'), async (req, res) => {
          try {
              if (!pool) {
                  return res.status(500).json({ error: 'Conexión a la base de datos no establecida.' });
              }
              const request = pool.request();
              const result = await request.query('SELECT IdUsuario, NombreUsuario, CorreoElectronico, FechaRegistro FROM Usuarios');
              res.json(result.recordset);
          } catch (error) {
              console.error('Error al obtener los usuarios:', error);
              res.status(500).json({ error: 'Error al obtener los usuarios.' });
          }
      });

      // Ruta para servir admin.html (PROTEGIDA)
    app.get('/admin', isAuthorized('admin'), (req, res) => {
      res.sendFile(path.join(__dirname, 'public/admin/admin.html')); // Envía admin.html
    });

    // Ruta de login para generar el token JWT
    app.post('/login', async (req, res) => {
      console.log('Datos recibidos:', req.body);
      try {
        const { username, password } = req.body;
        if (!username || !password) {
          return res.status(400).json({ error: 'Faltan datos de inicio de sesión.' });
        }

        const request = pool.request();
        request.input('NombreUsuario', sql.VarChar(50), username);
        const query = `SELECT IdUsuario, Rol, Contrasena FROM Usuarios WHERE NombreUsuario = @NombreUsuario`;

        const result = await request.query(query);

        const user = result.recordset[0];

        if (!user) {
          return res.status(401).json({ error: 'Usuario no encontrado.' });
        }

        const passwordMatch = await bcrypt.compare(password, user.Contrasena);

        if (!passwordMatch) {
          return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        const payload = { userId: user.IdUsuario, role: user.Rol };
        const secret = process.env.JWT_SECRET;
        const token = jwt.sign(payload, secret, { expiresIn: '1h' });

        res.json({ token });
      } catch (error) {
        console.error('Error en el login:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
      }
    });

  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
  }
}

startServer();
