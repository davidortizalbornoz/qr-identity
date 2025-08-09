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

    if (!base64String.match(/^data:image\/(jpeg|png|gif|webp);base64,/)) {
      throw new BadRequestException('Formato de imagen base64 inválido');
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

    const imageType = base64String.match(/^data:(image\/[^;]+);base64,/)?.[1];
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
    id: string,
    originalName: string,
  ): string {
    const fileName = this.generateFileNameWithId(originalName, id);
    return `${folderPath}${fileName}`;
  }

  async uploadFile(
    file: Express.Multer.File,
    id: string,
    vcardType?: string,
  ): Promise<string> {
    this.validateFile(file);

    const folderPath = this.getFolderPathByVcardType(vcardType);
    const s3Key = this.generateS3Key(folderPath, id, file.originalname);

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
      this.logger.log(`Archivo subido exitosamente: ${fileUrl}`);
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
    id: string,
    vcardType?: string,
  ): Promise<string> {
    this.validateBase64Image(base64String, mimeType);

    const base64Content = base64String.split(',')[1];
    const buffer = Buffer.from(base64Content, 'base64');

    const folderPath = this.getFolderPathByVcardType(vcardType);
    const s3Key = this.generateS3Key(folderPath, id, fileName);

    const command = new PutObjectCommand({
      Bucket: awsS3Config.bucketName,
      Key: s3Key,
      Body: buffer,
      ContentType: mimeType,
      ACL: 'public-read',
    });

    try {
      await this.s3Client.send(command);
      const fileUrl = `https://${awsS3Config.bucketName}.s3.${awsS3Config.region}.amazonaws.com/${s3Key}`;
      this.logger.log(`Imagen base64 subida exitosamente: ${fileUrl}`);
      return fileUrl;
    } catch (error) {
      this.logger.error('Error al subir imagen base64 a S3:', error);
      throw new BadRequestException('Error al subir imagen a S3');
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
      this.logger.log(`Archivo eliminado exitosamente: ${fileUrl}`);
    } catch (error) {
      this.logger.error('Error al eliminar archivo de S3:', error);
      throw new BadRequestException('Error al eliminar archivo de S3');
    }
  }
}
