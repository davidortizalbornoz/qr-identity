/* eslint-disable no-undef */
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { awsS3Config } from '../config/aws-s3.config';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly logger = new Logger(S3Service.name);

  constructor() {
    this.logger.log('Inicializando S3Service con configuración:', {
      region: awsS3Config.region,
      bucketName: awsS3Config.bucketName,
      hasAccessKey: !!awsS3Config.accessKeyId,
      hasSecretKey: !!awsS3Config.secretAccessKey,
    });

    this.s3Client = new S3Client({
      region: awsS3Config.region,
      credentials: {
        accessKeyId: awsS3Config.accessKeyId || '',
        secretAccessKey: awsS3Config.secretAccessKey || '',
      },
    });
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    if (file.size > awsS3Config.uploadConfig.maxFileSize) {
      throw new BadRequestException(
        `El archivo excede el tamaño máximo permitido (${awsS3Config.uploadConfig.maxFileSize / 1024 / 1024}MB)`,
      );
    }

    if (!awsS3Config.uploadConfig.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipo de archivo no permitido. Tipos permitidos: ${awsS3Config.uploadConfig.allowedMimeTypes.join(', ')}`,
      );
    }
  }

  private validateBase64Image(base64String: string, mimeType: string): void {
    if (!base64String) {
      throw new BadRequestException(
        'No se proporcionó ninguna imagen en base64',
      );
    }

    // Validación más flexible para el formato base64
    const base64Regex = /^data:image\/(jpeg|png|gif|webp);base64,/i;
    if (!base64Regex.test(base64String)) {
      this.logger.error('Formato base64 inválido');
      throw new BadRequestException('Formato de imagen base64 inválido. Debe ser: data:image/[tipo];base64,[datos]');
    }

    const base64Content = base64String.split(',')[1];
    if (!base64Content) {
      throw new BadRequestException('Contenido base64 inválido');
    }

    const sizeInBytes = Math.ceil((base64Content.length * 3) / 4);

    if (sizeInBytes > awsS3Config.uploadConfig.maxFileSize) {
      throw new BadRequestException(
        `La imagen excede el tamaño máximo permitido (${awsS3Config.uploadConfig.maxFileSize / 1024 / 1024}MB)`,
      );
    }

    const imageType = base64String.match(/^data:(image\/[^;]+);base64,/i)?.[1];

    if (
      !imageType ||
      !awsS3Config.uploadConfig.allowedMimeTypes.includes(imageType)
    ) {
      throw new BadRequestException(
        `Tipo de imagen no permitido. Tipos permitidos: ${awsS3Config.uploadConfig.allowedMimeTypes.join(', ')}`,
      );
    }
  }

  private getFolderPathByVcardType(vcardType?: string): string {
    switch (vcardType?.toLowerCase()) {
      case 'mascota':
        return awsS3Config.uploadConfig.folderPathMascotas;
      case 'persona':
        return awsS3Config.uploadConfig.folderPathPersonas;
      default:
        return awsS3Config.uploadConfig.folderPathPersonas;
    }
  }

  private generateFileNameWithId(originalName: string, id: string): string {
    const timestamp = Date.now();
    const extension = originalName.split('.').pop();
    return `${timestamp}-${id}.${extension}`;
  }

  private generateS3Key(
    folderPath: string,
    nanoId: string,
    originalName: string,
  ): string {
    const extension = originalName.split('.').pop();
    return `${folderPath}${nanoId}/${nanoId}.${extension}`;
  }

  async uploadFile(
    file: Express.Multer.File,
    nanoId: string,
    vcardType?: string,
  ): Promise<string> {
    this.validateFile(file);

    const folderPath = this.getFolderPathByVcardType(vcardType);
    const s3Key = this.generateS3Key(folderPath, nanoId, file.originalname);

    const command = new PutObjectCommand({
      Bucket: awsS3Config.bucketName,
      Key: s3Key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    });

    try {
      await this.s3Client.send(command);
      const fileUrl = `https://${awsS3Config.bucketName}.s3.${awsS3Config.region}.amazonaws.com/${s3Key}`;
      this.logger.log(`Archivo subido a S3: ${fileUrl}`);
      return fileUrl;
    } catch (error) {
      this.logger.error('Error al subir archivo a S3:', error);
      throw new BadRequestException('Error al subir archivo a S3');
    }
  }

  async uploadBase64Image(
    base64String: string,
    fileName: string,
    mimeType: string,
    nanoId: string,
    vcardType?: string,
  ): Promise<string> {
    try {
      this.validateBase64Image(base64String, mimeType);

      const base64Content = base64String.split(',')[1];
      const buffer = Buffer.from(base64Content, 'base64');

      const folderPath = this.getFolderPathByVcardType(vcardType);
      const s3Key = this.generateS3Key(folderPath, nanoId, fileName);

      const command = new PutObjectCommand({
        Bucket: awsS3Config.bucketName,
        Key: s3Key,
        Body: buffer,
        ContentType: mimeType,
        ACL: 'public-read',
      });

      await this.s3Client.send(command);
      
      const fileUrl = `https://${awsS3Config.bucketName}.s3.${awsS3Config.region}.amazonaws.com/${s3Key}`;
      this.logger.log(`Imagen subida a S3: ${fileUrl}`);
      return fileUrl;
    } catch (error) {
      this.logger.error('Error al subir imagen a S3:', {
        error: error.message,
        fileName,
        nanoId,
        vcardType,
      });
      
      if (error.name === 'AccessDenied') {
        throw new BadRequestException('Acceso denegado a S3. Verificar credenciales y permisos.');
      }
      
      if (error.name === 'NoSuchBucket') {
        throw new BadRequestException('Bucket S3 no encontrado. Verificar configuración.');
      }
      
      if (error.name === 'InvalidAccessKeyId') {
        throw new BadRequestException('Clave de acceso AWS inválida.');
      }
      
      throw new BadRequestException(`Error al subir imagen a S3: ${error.message}`);
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl) {
      return;
    }

    try {
      const url = new URL(fileUrl);
      const key = url.pathname.substring(1);

      const command = new DeleteObjectCommand({
        Bucket: awsS3Config.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`Archivo eliminado de S3: ${fileUrl}`);
    } catch (error) {
      this.logger.error('Error al eliminar archivo de S3:', error);
      throw new BadRequestException('Error al eliminar archivo de S3');
    }
  }
}
