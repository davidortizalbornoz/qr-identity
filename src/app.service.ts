/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, Logger, OnModuleInit, NotFoundException, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Identity } from './entities/identity.entity';
import { S3Service } from './services/s3.service';
import { GenerateRequestDto } from './dto/register-post-request.dto';
import { ResponsePostDto } from './dto/register-post-response.dto';
import { NanoIDConfigService } from './services/nanoid.config.service';
import { databaseConfig } from './config/database.config';

@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger(AppService.name);

  constructor(
    @InjectRepository(Identity)
    private readonly identityRepository: Repository<Identity>,
    private readonly s3Service: S3Service,
    private readonly nanoIDConfigService: NanoIDConfigService,
  ) {
    this.logger.log('Configuración de conexión a BD:', {
      type: (databaseConfig as any).type,
      host: (databaseConfig as any).host,
      port: (databaseConfig as any).port,
      database: (databaseConfig as any).database,
      schema: (databaseConfig as any).schema,
      username: (databaseConfig as any).username,
      hasPassword: !!(databaseConfig as any).password,
      synchronize: (databaseConfig as any).synchronize,
    });
  }

  async onModuleInit() {
    // Verificar conexión a la base de datos después de que el módulo esté inicializado
    await this.verifyDatabaseConnection();
  }

  private async verifyDatabaseConnection(): Promise<void> {
    try {
      // Intentar hacer una consulta simple para verificar la conexión
      const result = await this.identityRepository.query('SELECT 1 as test');
      this.logger.log('Conexión a BD establecida correctamente');
    } catch (error) {
      this.logger.error('Error de conexión a BD:', {
        error: error.message,
        code: error.code,
      });
    }
  }

  private async uploadImageToS3(
    imageBase64: string,
    imageName: string,
    imageType: string,
    nanoId: string,
    vcardType: string
  ): Promise<string | null> {
    try {
      const imagePathS3 = await this.s3Service.uploadBase64Image(
        imageBase64,
        imageName,
        imageType,
        nanoId,
        vcardType
      );
      
      return imagePathS3;
    } catch (error) {
      this.logger.error('Error al subir imagen a S3:', error);
      return null;
    }
  }

  async register(body: GenerateRequestDto): Promise<ResponsePostDto> {
    try {
      // Generar un nuevo nanoId
      const nanoId = this.nanoIDConfigService.generateId();
      
      // Crear el contenido del QR con la URL base + nanoId
      const qrContent = `http://056.cl/${nanoId}`;
      
      // Crear la entidad para persistir en BD
      const identityEntity = new Identity();
      identityEntity.nano_id = nanoId;
      identityEntity.qr_content = qrContent;
      identityEntity.vcardType = body.vcardType;
      identityEntity.data = body.data;
      identityEntity.picPath = null; // Se actualizará si hay imagen
      
      // Persistir en la base de datos primero para obtener el ID
      const savedIdentity = await this.identityRepository.save(identityEntity);
      this.logger.log(`Registro persistido en BD - ID: ${savedIdentity.id}, NanoId: ${nanoId}`);
      
      // Subir imagen a S3 si se proporciona
      let imagePathS3 = null;
      if (body.imageBase64 && body.imageName && body.imageType) {
        imagePathS3 = await this.uploadImageToS3(
          body.imageBase64,
          body.imageName,
          body.imageType,
          nanoId,
          body.vcardType
        );
        
        // Actualizar el picPath en la base de datos si la subida fue exitosa
        if (imagePathS3) {
          savedIdentity.picPath = imagePathS3;
          await this.identityRepository.save(savedIdentity);
        }
      } else {
        this.logger.log(`No se proporcionó imagen para NanoId: ${nanoId}`);
      }
      
      // Preparar la respuesta
      const response: ResponsePostDto = {
        id: savedIdentity.id,
        nanoId: savedIdentity.nano_id,
        qrContent: savedIdentity.qr_content,
        vcardType: savedIdentity.vcardType,
        image: {
          imageName: body.imageName,
          imageType: body.imageType,
          imagePathS3: imagePathS3,
        },
        data: savedIdentity.data,
        created_at: `${savedIdentity.created_at.getFullYear()}-${String(savedIdentity.created_at.getMonth() + 1).padStart(2, '0')}-${String(savedIdentity.created_at.getDate()).padStart(2, '0')}T${String(savedIdentity.created_at.getHours()).padStart(2, '0')}:${String(savedIdentity.created_at.getMinutes()).padStart(2, '0')}:${String(savedIdentity.created_at.getSeconds()).padStart(2, '0')}.${String(savedIdentity.created_at.getMilliseconds()).padStart(3, '0')}Z`,
      };
      
      this.logger.log(`Registro completado exitosamente - ID: ${savedIdentity.id}, NanoId: ${nanoId}`);
      return response;
    } catch (error) {
      this.logger.error('Error al procesar la solicitud de registro', error);
      
      // Manejar errores específicos de la base de datos
      if (error.code === '23505') { // Código de error PostgreSQL para unique constraint violation
        throw new Error('El QR ID generado ya existe, intente nuevamente');
      }
      
      if (error.code === '23502') { // Código de error PostgreSQL para not null constraint violation
        throw new Error('Datos requeridos faltantes');
      }
      
      throw new Error('Error al procesar la solicitud de registro');
    }
  }

  async findByIdentity(nanoId: string): Promise<ResponsePostDto> {
    try {
      // Buscar la identidad por nano_id
      const identity = await this.identityRepository.findOne({
        where: { nano_id: nanoId }
      });

      if (!identity) {
        throw new NotFoundException(`No se encontró identidad con nanoId: ${nanoId}`);
      }

      this.logger.log(`Identidad encontrada - ID: ${identity.id}, NanoId: ${nanoId}`);

      // Extraer información de la imagen del picPath si existe
      let imageName = null;
      let imageType = null;
      let imagePathS3 = identity.picPath;

      if (identity.picPath) {
        // Extraer el nombre del archivo de la URL de S3
        const urlParts = identity.picPath.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const fileNameParts = fileName.split('.');
        
        if (fileNameParts.length >= 2) {
          imageName = fileName;
          // Determinar el tipo de imagen basado en la extensión
          const extension = fileNameParts[fileNameParts.length - 1].toLowerCase();
          switch (extension) {
            case 'jpg':
            case 'jpeg':
              imageType = 'image/jpeg';
              break;
            case 'png':
              imageType = 'image/png';
              break;
            case 'gif':
              imageType = 'image/gif';
              break;
            case 'webp':
              imageType = 'image/webp';
              break;
            default:
              imageType = 'image/jpeg'; // Por defecto
          }
        }
      }

      // Preparar la respuesta con el mismo formato que el POST
      const response: ResponsePostDto = {
        id: identity.id,
        nanoId: identity.nano_id,
        qrContent: identity.qr_content,
        vcardType: identity.vcardType,
        image: {
          imageName: imageName,
          imageType: imageType,
          imagePathS3: imagePathS3,
        },
        data: identity.data,
        created_at: `${identity.created_at.getFullYear()}-${String(identity.created_at.getMonth() + 1).padStart(2, '0')}-${String(identity.created_at.getDate()).padStart(2, '0')}T${String(identity.created_at.getHours()).padStart(2, '0')}:${String(identity.created_at.getMinutes()).padStart(2, '0')}:${String(identity.created_at.getSeconds()).padStart(2, '0')}.${String(identity.created_at.getMilliseconds()).padStart(3, '0')}Z`,
      };

      this.logger.log(`Consulta completada exitosamente - ID: ${identity.id}, NanoId: ${nanoId}`);
      return response;
    } catch (error) {
      this.logger.error('Error al buscar identidad por nanoId', error);
      
      // Si ya es una HttpException, la propagamos
      if (error instanceof HttpException) {
        throw error;
      }
      
      // Para errores de base de datos
      if (error.code === '23505') {
        throw new Error('Error de duplicación en la base de datos');
      }
      
      throw new Error('Error al buscar la identidad');
    }
  }
}
