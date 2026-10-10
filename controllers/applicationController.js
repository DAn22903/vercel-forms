const pool = require('../config/db');

const requiredFields = [
  'nombre_completo',
  'correo_electronico',
  'telefono',
  'direccion',
  'fecha_nacimiento',
  'curp_rfc_dni',
  'estado_civil',
  'puesto_solicitado',
  'disponibilidad_horario',
  'nivel_estudios',
  'institucion_educativa',
  'estado_estudios',
  'empresa_anterior',
  'puesto_anterior',
  'tiempo_trabajado',
  'motivo_salida',
  'telefono_contacto_laboral',
  'nombre_referencia',
  'telefono_referencia',
  'relacion_referencia'
];

const textLimits = {
  nombre_completo: 150,
  correo_electronico: 254,
  telefono: 30,
  direccion: 255,
  curp_rfc_dni: 30,
  estado_civil: 30,
  puesto_solicitado: 150,
  disponibilidad_horario: 100,
  nivel_estudios: 100,
  institucion_educativa: 180,
  empresa_anterior: 180,
  puesto_anterior: 150,
  tiempo_trabajado: 100,
  motivo_salida: 255,
  telefono_contacto_laboral: 30,
  nombre_referencia: 150,
  telefono_referencia: 30,
  relacion_referencia: 100
};

function validateApplication(body) {
  const errors = [];
  const values = {};

  for (const field of requiredFields) {
    if (typeof body[field] !== 'string' || !body[field].trim()) {
      errors.push(`El campo ${field} es obligatorio.`);
    } else {
      values[field] = body[field].trim();
      if (values[field].length > textLimits[field]) {
        errors.push(`El campo ${field} excede el máximo de ${textLimits[field]} caracteres.`);
      }
    }
  }

  if (values.correo_electronico && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.correo_electronico)) {
    errors.push('Ingresa un correo electrónico válido.');
  }
  for (const field of ['telefono', 'telefono_contacto_laboral', 'telefono_referencia']) {
    if (values[field] && !/^[+\d\s().-]{7,30}$/.test(values[field])) {
      errors.push(`El campo ${field} debe contener un teléfono válido.`);
    }
  }
  if (values.estado_estudios && !['concluido', 'en_curso'].includes(values.estado_estudios)) {
    errors.push('Selecciona un estado de estudios válido.');
  }
  if (values.fecha_nacimiento) {
    const date = new Date(`${values.fecha_nacimiento}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(values.fecha_nacimiento) ||
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== values.fecha_nacimiento ||
        date > new Date()) {
      errors.push('Ingresa una fecha de nacimiento válida que no sea futura.');
    }
  }

  let salary = null;
  if (body.sueldo_deseado !== undefined && body.sueldo_deseado !== '') {
    salary = Number(body.sueldo_deseado);
    if (!Number.isFinite(salary) || salary < 0 || salary > 9999999999.99) {
      errors.push('El sueldo deseado debe ser un monto válido y no negativo.');
    }
  }

  return { errors, values: { ...values, sueldo_deseado: salary } };
}

async function createApplication(req, res, next) {
  const { errors, values } = validateApplication(req.body);
  if (errors.length) {
    return res.status(400).json({ error: 'Revisa los datos del formulario.', details: errors });
  }

  const columns = [...requiredFields, 'sueldo_deseado'];
  const sql = `INSERT INTO solicitudes_empleo (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`;

  try {
    const [result] = await pool.execute(sql, columns.map((column) => values[column]));
    res.status(201).json({
      message: '¡Gracias por postularte! Tu solicitud ha sido recibida.',
      id: result.insertId
    });
  } catch (error) {
    next(error);
  }
}

async function listApplications(req, res, next) {
  const search = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
  try {
    const [rows] = await pool.execute(
      `SELECT id, nombre_completo, correo_electronico, telefono, puesto_solicitado, fecha_registro
       FROM solicitudes_empleo
       WHERE ? = '' OR nombre_completo LIKE ? OR puesto_solicitado LIKE ?
       ORDER BY fecha_registro DESC`,
      [search, `%${search}%`, `%${search}%`]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

async function getApplication(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Identificador de solicitud inválido.' });
  }
  try {
    const [rows] = await pool.execute('SELECT * FROM solicitudes_empleo WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'No se encontró la solicitud.' });
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
}

module.exports = { createApplication, listApplications, getApplication };
