# medicamentos-backend

Backend en Node.js + Express para la gestión de medicamentos y registro de tomas. Expone una API REST con operaciones CRUD sobre la base de datos MySQL `medicamentos_app`.

## Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior
- [MySQL](https://www.mysql.com/) 8.0 o superior (servidor en ejecución)
- Un cliente MySQL (MySQL Workbench, línea de comandos `mysql`, DBeaver, etc.)

## Estructura del proyecto

```
medicamentos-backend/
├── package.json
├── .env.example          # Plantilla de variables de entorno (sin credenciales reales)
├── .gitignore
├── schema.sql            # Script de creación de la base de datos y tablas
├── README.md
└── src/
    ├── db.js             # Pool de conexiones mysql2
    ├── server.js         # Configuración de Express y arranque del servidor
    └── routes/
        ├── perfiles.js     # CRUD de perfiles      → /api/perfiles
        ├── medicamentos.js # CRUD de medicamentos  → /api/medicamentos
        └── historial.js    # CRUD de historial     → /api/historial
```

## Puesta en marcha

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd medicamentos-backend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar las variables de entorno

Copiá el archivo `.env.example` a `.env` y completá con tus credenciales reales de MySQL:

```bash
cp .env.example .env
```

Editá `.env` con tus datos:

```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password_aqui
DB_NAME=medicamentos_app
PORT=3000
```

> **Importante:** Nunca subas el archivo `.env` al repositorio. Ya está excluido en `.gitignore`.

### 4. Crear la base de datos y las tablas

Ejecutá el script `schema.sql` en tu servidor MySQL. Podés hacerlo desde MySQL Workbench (abrir el archivo y ejecutarlo) o desde la línea de comandos:

```bash
mysql -h 127.0.0.1 -P 3306 -u root -p < schema.sql
```

Te pedirá la contraseña de tu usuario de MySQL. Este script crea la base de datos `medicamentos_app` y todas las tablas necesarias:

- `usuarios`
- `perfiles`
- `medicamentos`
- `horarios_toma`
- `historial_tomas`

### 5. Iniciar el servidor

```bash
npm run dev
```

Verás en la consola:

```
Servidor corriendo en http://0.0.0.0:3000
```

El servidor quedará escuchando en `http://localhost:3000`.

## Endpoints de la API

### Perfiles (`/api/perfiles`)

| Método | Ruta              | Descripción                  |
|--------|-------------------|------------------------------|
| GET    | `/api/perfiles`     | Listar todos los perfiles    |
| GET    | `/api/perfiles/:id` | Obtener un perfil por id     |
| POST   | `/api/perfiles`     | Crear un perfil              |
| PUT    | `/api/perfiles/:id` | Actualizar un perfil         |
| DELETE | `/api/perfiles/:id` | Eliminar un perfil            |

### Medicamentos (`/api/medicamentos`)

| Método | Ruta                 | Descripción                    |
|--------|----------------------|--------------------------------|
| GET    | `/api/medicamentos`    | Listar todos los medicamentos  |
| GET    | `/api/medicamentos/:id` | Obtener un medicamento por id  |
| POST   | `/api/medicamentos`    | Crear un medicamento           |
| PUT    | `/api/medicamentos/:id` | Actualizar un medicamento      |
| DELETE | `/api/medicamentos/:id` | Eliminar un medicamento       |

### Historial de tomas (`/api/historial`)

| Método | Ruta               | Descripción                          |
|--------|--------------------|--------------------------------------|
| GET    | `/api/historial`     | Listar todo el historial de tomas    |
| GET    | `/api/historial/:id` | Obtener un registro por id           |
| POST   | `/api/historial`     | Crear un registro en el historial    |
| PUT    | `/api/historial/:id` | Actualizar un registro del historial |
| DELETE | `/api/historial/:id` | Eliminar un registro del historial  |

## Scripts disponibles

- `npm run dev` — Inicia el servidor con `nodemon` (reinicia automáticamente ante cambios en el código).
- `npm start` — Inicia el servidor con `node` (producción).
