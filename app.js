require('dotenv').config();

const { readFile } = require('node:fs/promises');
const path = require('node:path');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const pool = require('./config/db');
const applicationRoutes = require('./routes/applicationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { requireAdmin } = require('./middleware/adminAuth');

const requiredEnvironment = ['DB_HOST', 'DB_USER', 'SESSION_SECRET', 'ADMIN_USERNAME', 'ADMIN_PASSWORD'];
const missingEnvironment = requiredEnvironment.filter((key) => !process.env[key]);
if (missingEnvironment.length) {
  throw new Error(`Faltan variables de entorno requeridas: ${missingEnvironment.join(', ')}`);
}
if (process.env.SESSION_SECRET.length < 32) {
  throw new Error('SESSION_SECRET debe tener al menos 32 caracteres.');
}

const app = express();
const port = Number(process.env.PORT || 3000);
const publicDirectory = path.join(__dirname, 'public');

app.disable('x-powered-by');
app.use(helmet());
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use(session({
  name: 'recruit.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60 * 1000
  }
}));

app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);
app.use(express.static(publicDirectory));

app.get('/admin', (req, res) => {
  if (req.session.isAdmin) {
    return res.sendFile(path.join(__dirname, 'views', 'admin.html'));
  }
  res.sendFile(path.join(publicDirectory, 'admin-login.html'));
});
app.get('/admin/dashboard', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  res.status(500).json({ error: 'Ocurrió un error interno. Intenta nuevamente.' });
});

async function start() {
  const schema = await readFile(path.join(__dirname, 'database', 'schema.sql'), 'utf8');
  await pool.query(schema);
  console.log('Tabla solicitudes_empleo lista.');
  app.listen(port, () => {
    console.log(`Aplicación lista en http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error('No se pudo iniciar la aplicación o conectar con MySQL:', error);
  process.exitCode = 1;
});
