import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as QRCode from 'qrcode';
import { Identity } from './entities/identity.entity';
import { S3Service } from './services/s3.service';
import { ConfigService } from './services/config.service';
import { GenerateRequestDto } from './dto/generate-request.dto';
import { ResponsePostDto } from './dto/response-post.dto';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    @InjectRepository(Identity)
    private readonly identityRepository: Repository<Identity>,
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
  ) {}

  getHello(): string {
    return '¡Hola Mundo!';
  }

  async generateQR(data: GenerateRequestDto, file?: Express.Multer.File): Promise<ResponsePostDto> {
    const id = this.configService.generateId();
    
    // Generar QR code
    const qrCodeData = `https://tu-dominio.com/${id}`;
    const qrCode = await QRCode.toDataURL(qrCodeData);

    // Preparar datos de respuesta
    const responseData: any = {
      ...data.data,
      vcardType: data.vcardType,
      created_at: new Date().toLocaleString('es-CL', {
        timeZone: 'America/Santiago',
      }),
    };

    // Subir imagen si se proporciona
    if (file) {
      try {
        const picPath = await this.s3Service.uploadFile(file, id, data.vcardType);
        responseData.picPath = picPath;
      } catch (error) {
        this.logger.error('Error al subir imagen:', error);
        throw error;
      }
    }

    // Guardar en base de datos
    const identity = this.identityRepository.create({
      id,
      qrCode,
      data: responseData,
      vcardType: data.vcardType,
      picPath: responseData.picPath,
    });

    await this.identityRepository.save(identity);

    return {
      id,
      qrCode,
      data: responseData,
    };
  }

  async generateQRWithBase64Image(
    data: GenerateRequestDto,
    base64Image: string,
    fileName: string,
    mimeType: string,
  ): Promise<ResponsePostDto> {
    const id = this.configService.generateId();
    
    // Generar QR code
    const qrCodeData = `https://tu-dominio.com/${id}`;
    const qrCode = await QRCode.toDataURL(qrCodeData);

    // Preparar datos de respuesta
    const responseData: any = {
      ...data.data,
      vcardType: data.vcardType,
      created_at: new Date().toLocaleString('es-CL', {
        timeZone: 'America/Santiago',
      }),
    };

    // Subir imagen base64
    try {
      const picPath = await this.s3Service.uploadBase64Image(
        base64Image,
        fileName,
        mimeType,
        id,
        data.vcardType,
      );
      responseData.picPath = picPath;
    } catch (error) {
      this.logger.error('Error al subir imagen base64:', error);
      throw error;
    }

    // Guardar en base de datos
    const identity = this.identityRepository.create({
      id,
      qrCode,
      data: responseData,
      vcardType: data.vcardType,
      picPath: responseData.picPath,
    });

    await this.identityRepository.save(identity);

    return {
      id,
      qrCode,
      data: responseData,
    };
  }
}
