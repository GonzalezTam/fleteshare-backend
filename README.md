# Fleteshare Backend (WIP)

API RESTful construida con Node.js, Express y TypeScript, conectada a MongoDB y usando Cloudinary para gestión de archivos.

## Requisitos previos

- Node.js >= 18.x
- npm >= 9.x
- MongoDB
- Cuenta en Cloudinary (para pruebas de subida de archivos)

## Guía para instalar Node.js y MongoDB (omitir si ya están instalados)

### Instalar Node.js y npm

1. Ir a https://nodejs.org/es/download y descargar la versión recomendada para tu sistema operativo (Windows, Mac o Linux).
2. Instalá siguiendo los pasos del instalador.
3. Para verificar que la instalación fue exitosa, abrí una terminal y ejecutá:
   ```zsh
   node -v
   npm -v
   ```
   Deberías ver los números de versión de Node.js y npm.

### Instalar MongoDB Compass

MongoDB Compass es una interfaz gráfica que te permite ver y administrar tus bases de datos de forma visual, sin usar la terminal.

1. Ve a https://www.mongodb.com/try/download/compass y descargá la versión para tu sistema operativo.
2. Instalá Compass siguiendo los pasos del instalador.
3. Abrí MongoDB Compass.
4. En el campo de conexión, ingresá:
   ```
   mongodb://localhost:27017
   ```
5. Hacé clic en "Connect". Cuando corras el backend, aparecerá automáticamente `fleteshare_local`.

---

## Instalación

1. **Cloná el repositorio:**

```zsh
git clone https://github.com/agustintamb/fleteshare-backend.git
cd fleteshare-backend
```

2. **Instalá las dependencias:**

```zsh
npm install
```

3. **Configurá las variables de entorno:**

Creá el archivo `.env.development` (usando el .env.example de ejemplo) en la raíz del proyecto con el siguiente contenido:

```env
NODE_ENV=development
PORT=8000
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
MONGODB_URI=mongodb://localhost:27017/fleteshare_local
JWT_SECRET=una_clave_secreta_segura
FRONTEND_URL=http://localhost:5173
BACKOFFICE_URL=http://localhost:5174
```

> **Importante:** No subas tus archivos `.env*` al repositorio. Ya están en `.gitignore`.

## Configura tu base de datos MongoDB:

Asegúrate de tener una instancia de MongoDB corriendo localmente o usa una URI remota.

## Scripts útiles

- `npm run dev` — Inicia el servidor en modo desarrollo con recarga automática (nodemon).
- `npm run build` — Compila el proyecto a JavaScript en la carpeta `dist`.
- `npm start` — Inicia el servidor en modo producción (usa la carpeta `dist`).
- `npm run db:wipe` — Borra **todas** las colecciones y datos de la base de datos de desarrollo (`fleteshare_local`). Útil para empezar desde cero, pero ¡elimina todo! Solo usar en entorno local.
- `npm run db:simpleSeed` — Inserta usuarios y datos de prueba en la base de datos. Ideal para tener datos de ejemplo rápidamente y probar la app sin tener que registrarlos manualmente.

## Datos de prueba

Al ejecutar `npm run db:simpleSeed` se crean automáticamente varias cuentas de usuario para que puedas probar la aplicación sin tener que registrarlas manualmente. Los datos de acceso son:

- **Administrador**

  - Email: `admin@mail.com`
  - Contraseña: `admin123`

- **Cliente 1 (Perfil incompleto)**

  - Email: `cliente@mail.com`
  - Contraseña: `cliente123`

- **Cliente 2 (Perfil completo)**

  - Email: `cliente2@mail.com`
  - Contraseña: `cliente123`

- **Transportista 1 (Perfil incompleto)**

  - Email: `transportista@mail.com`
  - Contraseña: `camion123`

- **Transportista 2 (Perfil completo y validado)**
  - Email: `transportista2@mail.com`
  - Contraseña: `camion123`

## Estructura del proyecto (WIP)

```
src/
  index.ts                # Punto de entrada principal
  config/                 # Configuración de entorno, base de datos, cloudinary, multer
  controllers/            # Lógica de endpoints (auth, usuario, notificaciones)
  middlewares/            # Middlewares de autenticación, roles, etc.
  models/                 # Modelos de Mongoose
  routes/                 # Definición de rutas Express
  scripts/                # Scripts CLI para desarrollo (seed, wipe)
  services/               # Lógica de negocio y acceso a datos
  types/                  # Tipos TypeScript compartidos
  utils/                  # Utilidades varias
```

## Levantar el proyecto en desarrollo

1. Asegúrate de tener tu base de datos MongoDB corriendo.
2. Ejecuta:

```zsh
npm run dev
```

El backend estará disponible en `http://localhost:8000` (o el puerto que definas en tu `.env`).

## Endpoints principales (WIP)

- `/api/auth` — Autenticación y registro
- `/api/users` — Gestión de usuarios
- `/api/notifications` — Notificaciones

Consulta el código fuente para ver los endpoints y payloads específicos.

> _Actualizado: 16 de junio de 2025_ (WIP)
