# Sistema de reclutamiento

Aplicación web con formulario público de solicitudes de empleo y un panel privado para el equipo de RR. HH. Está implementada con Node.js, Express y MySQL.

## Estructura

```text
reclutamiento-app/
├── app.js
├── config/
│   └── db.js
├── scripts/
│   └── init-db.js
├── controllers/
│   └── applicationController.js
├── database/
│   └── schema.sql
├── middleware/
│   └── adminAuth.js
├── public/
│   ├── admin-login.html
│   ├── admin-login.js
│   ├── admin.js
│   ├── application.js
│   ├── index.html
│   └── styles.css
├── routes/
│   ├── adminRoutes.js
│   └── applicationRoutes.js
├── views/
│   └── admin.html
├── .env.example
└── package.json
```

## Requisitos y ejecución local

Se requiere Node.js 18 o superior y un servicio compatible con el protocolo MySQL. Para TiDB Cloud, copia los parámetros de conexión desde la consola del clúster.

1. Instala dependencias: `npm install`.
2. Copia `.env.example` a `.env`. Configura `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME` con los valores de conexión del clúster TiDB Cloud. TiDB Cloud suele usar el puerto `4000`, pero utiliza el valor que indique la consola. Define también `SESSION_SECRET` con al menos 32 caracteres y las credenciales del administrador. No publiques `.env`.
3. Inicia el servidor con `npm run dev` (recarga automática) o `npm start`.
4. Al arrancar, la aplicación se conecta al clúster TiDB Cloud usando TLS si `DB_SSL=true` (valor predeterminado) y ejecuta `database/schema.sql` para crear `solicitudes_empleo` si todavía no existe. Asegúrate de que el clúster permita conexiones desde el entorno donde se ejecuta la aplicación.
5. Visita `http://localhost:3000` para el formulario y `http://localhost:3000/admin` para acceder al panel con las credenciales de `ADMIN_USERNAME` y `ADMIN_PASSWORD`.

Si la conexión, los permisos para crear la tabla o la configuración no están disponibles, la aplicación muestra el error y no inicia el servidor.

Para inicializar la tabla manualmente, configura `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` y `DB_SSL` en `.env`, y ejecuta `npm run db:init`. `DB_SSL` acepta `true` o `false` (también `1` o `0`) y por defecto usa TLS. Usa el hostname, usuario, contraseña, base de datos y los requisitos TLS indicados por TiDB Cloud para tu clúster.

## API

- `POST /api/applications`: valida y registra una solicitud.
- `POST /api/admin/login`: inicia una sesión de RR. HH.
- `POST /api/admin/logout`: cierra la sesión.
- `GET /api/applications?q=nombre-o-puesto`: lista y filtra solicitudes; requiere sesión.
- `GET /api/applications/:id`: devuelve el detalle; requiere sesión.

Las consultas usan parámetros preparados. Las sesiones en memoria son adecuadas para desarrollo local; para un despliegue con varias instancias, configura un almacén de sesiones persistente y habilita HTTPS (`NODE_ENV=production`).
