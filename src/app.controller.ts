import {
  Controller,
  Get,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppService } from './app.service';
import { GenerateRequestDto } from './dto/generate-request.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('generate')
  @UseInterceptors(FileInterceptor('image'))
  async generateQR(
    @Body() data: GenerateRequestDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    try {
      return await this.appService.generateQR(data, file);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('generate-base64')
  async generateQRWithBase64(
    @Body() body: {
      data: GenerateRequestDto;
      base64Image: string;
      fileName: string;
      mimeType: string;
    },
  ) {
    try {
      const { data, base64Image, fileName, mimeType } = body;
      
      if (!base64Image || !fileName || !mimeType) {
        throw new BadRequestException(
          'Se requieren base64Image, fileName y mimeType',
        );
      }

      return await this.appService.generateQRWithBase64Image(
        data,
        base64Image,
        fileName,
        mimeType,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
