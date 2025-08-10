/* eslint-disable no-undef */

export const awsS3Config = {
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  bucketName: process.env.AWS_S3_BUCKET_NAME || 'bucket-01-desarrollo',

  // Configuración para subida de archivos
  uploadConfig: {
    maxFileSize: parseInt(process.env.AWS_S3_MAX_FILE_SIZE || '10485760'), // 10MB
    allowedMimeTypes: (
      process.env.AWS_S3_ALLOWED_MIME_TYPES ||
      'image/jpeg,image/png,image/gif,image/webp'
    ).split(','),
    folderPathMascotas:
      process.env.AWS_S3_FOLDER_PATH_MASCOTAS ||
      'vCards056/uploads/images/mascotas/',
    folderPathPersonas:
      process.env.AWS_S3_FOLDER_PATH_PERSONAS ||
      'vCards056/uploads/images/personas/',
  },
};
