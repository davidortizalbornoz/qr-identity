# QR Identity API

API para generación de códigos QR con NestJS, TypeORM y AWS S3.

## 🚀 Configuración Inicial

### 1. Variables de Entorno

Copia el archivo `.env.example` a `.env` y configura las variables con tus valores reales:

```bash
cp .env.example .env
```

### 2. Configuración Requerida

#### 📊 PostgreSQL
- Instala PostgreSQL en tu sistema
- Crea una base de datos y usuario
- Configura las variables en `.env`:
  - `DB_HOST`: Host de PostgreSQL (ej: localhost, 127.0.0.1)
  - `DB_PORT`: Puerto (por defecto 5432)
  - `DB_USER`: Usuario de la base de datos
  - `DB_PASSWORD`: Contraseña del usuario
  - `DB_DATABASE`: Nombre de la base de datos
  - `DB_SCHEMA`: Esquema (por defecto public)

#### ☁️ AWS S3
- Crea una cuenta en AWS
- Crea un bucket S3
- Genera credenciales IAM (Access Key y Secret Key)
- Configura las variables en `.env`:
  - `AWS_REGION`: Región de tu bucket S3
  - `AWS_ACCESS_KEY_ID`: Tu Access Key ID
  - `AWS_SECRET_ACCESS_KEY`: Tu Secret Access Key
  - `AWS_S3_BUCKET_NAME`: Nombre de tu bucket
  - `AWS_S3_MAX_FILE_SIZE`: Tamaño máximo de archivo (bytes)
  - `AWS_S3_ALLOWED_MIME_TYPES`: Tipos de archivo permitidos
  - `AWS_S3_FOLDER_PATH_MASCOTAS`: Ruta para imágenes de mascotas
  - `AWS_S3_FOLDER_PATH_PERSONAS`: Ruta para imágenes de personas

#### 🔐 NanoID
- Configuración para generar IDs únicos:
  - `NANOID_SIZE`: Tamaño del ID (por defecto 10)
  - `NANOID_ALPHABET`: Caracteres permitidos

## 📦 Instalación

```bash
# Instalar dependencias
npm install
```

## ▶️ Ejecución

```bash
# Desarrollo (con hot reload)
npm run start:dev

# Producción
npm run start:prod

# Compilar
npm run build
```

## 🔗 Endpoints

- `POST /register` - Registrar nueva identidad
- `POST /generate` - Generar QR con imagen

## 📝 Notas Importantes

- El archivo `.env` contiene información sensible y NO debe subirse a Git
- El archivo `.env.example` sirve como plantilla y SÍ se incluye en el repositorio
- Asegúrate de que PostgreSQL esté ejecutándose antes de iniciar la aplicación
- Verifica que las credenciales de AWS S3 tengan permisos de lectura/escritura en el bucket
