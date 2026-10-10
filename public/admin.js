const body = document.querySelector('#applications-body');
const searchInput = document.querySelector('#search-input');
const countBadge = document.querySelector('#application-count');
const emptyState = document.querySelector('#empty-state');
const adminMessage = document.querySelector('#admin-message');
const detailDialog = document.querySelector('#detail-dialog');
let searchTimer;

function formatDate(value) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ?
    new Date(`${value}T00:00:00`) : new Date(value);
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(date);
}

function addCell(row, text, className) {
  const cell = document.createElement('td');
  cell.textContent = text;
  if (className) cell.className = className;
  row.append(cell);
}

async function loadApplications(search = '') {
  adminMessage.hidden = true;
  try {
    const response = await fetch(`/api/applications?q=${encodeURIComponent(search)}`);
    if (response.status === 401) return window.location.assign('/admin');
    if (!response.ok) throw new Error('No se pudo cargar la lista de solicitudes.');
    const applications = await response.json();
    body.replaceChildren();
    applications.forEach((application) => {
      const row = document.createElement('tr');
      const nameCell = document.createElement('td');
      const name = document.createElement('strong');
      name.textContent = application.nombre_completo;
      const email = document.createElement('span');
      email.className = 'cell-subtitle';
      email.textContent = application.correo_electronico;
      nameCell.append(name, email);
      row.append(nameCell);
      addCell(row, application.puesto_solicitado);
      addCell(row, application.telefono);
      addCell(row, formatDate(application.fecha_registro));
      const actionCell = document.createElement('td');
      const button = document.createElement('button');
      button.className = 'text-button';
      button.textContent = 'Ver detalle →';
      button.addEventListener('click', () => showDetail(application.id));
      actionCell.append(button);
      row.append(actionCell);
      body.append(row);
    });
    countBadge.textContent = `${applications.length} ${applications.length === 1 ? 'solicitud' : 'solicitudes'}`;
    emptyState.hidden = applications.length !== 0;
  } catch (error) {
    adminMessage.textContent = error.message;
    adminMessage.hidden = false;
  }
}

const detailSections = [
  ['Datos personales', [
    ['Correo electrónico', 'correo_electronico'], ['Teléfono', 'telefono'], ['Dirección', 'direccion'],
    ['Fecha de nacimiento', 'fecha_nacimiento'], ['CURP / RFC / DNI', 'curp_rfc_dni'], ['Estado civil', 'estado_civil']
  ]],
  ['Puesto solicitado', [['Puesto', 'puesto_solicitado'], ['Sueldo deseado', 'sueldo_deseado'], ['Disponibilidad', 'disponibilidad_horario']]],
  ['Educación', [['Nivel de estudios', 'nivel_estudios'], ['Institución', 'institucion_educativa'], ['Estado', 'estado_estudios']]],
  ['Experiencia laboral', [
    ['Empresa anterior', 'empresa_anterior'], ['Puesto anterior', 'puesto_anterior'], ['Tiempo trabajado', 'tiempo_trabajado'],
    ['Motivo de salida', 'motivo_salida'], ['Teléfono de contacto', 'telefono_contacto_laboral']
  ]],
  ['Referencia', [['Nombre', 'nombre_referencia'], ['Teléfono', 'telefono_referencia'], ['Relación / parentesco', 'relacion_referencia']]],
  ['Registro', [['Fecha de registro', 'fecha_registro']]
  ]
];

async function showDetail(id) {
  try {
    const response = await fetch(`/api/applications/${id}`);
    if (!response.ok) throw new Error('No se pudo cargar el detalle de esta solicitud.');
    const application = await response.json();
    document.querySelector('#detail-title').textContent = application.nombre_completo;
    const content = document.querySelector('#detail-content');
    content.replaceChildren();
    detailSections.forEach(([title, fields]) => {
      const section = document.createElement('section');
      section.className = 'detail-section';
      const heading = document.createElement('h3');
      heading.textContent = title;
      const grid = document.createElement('dl');
      grid.className = 'detail-grid';
      fields.forEach(([label, key]) => {
        const item = document.createElement('div');
        const term = document.createElement('dt');
        term.textContent = label;
        const value = document.createElement('dd');
        const rawValue = application[key];
        value.textContent = rawValue === null ? 'No especificado' :
          key === 'sueldo_deseado' && rawValue !== '' ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(rawValue) :
            key === 'fecha_registro' ? formatDate(rawValue) : String(rawValue);
        item.append(term, value);
        grid.append(item);
      });
      section.append(heading, grid);
      content.append(section);
    });
    detailDialog.showModal();
  } catch (error) {
    adminMessage.textContent = error.message;
    adminMessage.hidden = false;
  }
}

searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadApplications(searchInput.value.trim()), 250);
});

document.querySelector('#close-dialog').addEventListener('click', () => detailDialog.close());
detailDialog.addEventListener('click', (event) => {
  if (event.target === detailDialog) detailDialog.close();
});

document.querySelector('#logout-button').addEventListener('click', async () => {
  try {
    const response = await fetch('/api/admin/logout', { method: 'POST' });
    if (!response.ok) throw new Error('No se pudo cerrar la sesión.');
    window.location.assign('/admin');
  } catch (error) {
    adminMessage.textContent = error.message;
    adminMessage.hidden = false;
  }
});

loadApplications();
