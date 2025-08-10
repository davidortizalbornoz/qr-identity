import {
  Controller,
  Post,
  Body,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { AppService } from './app.service';
import { GenerateRequestDto } from './dto/register-post-request.dto';
import { ResponsePostDto } from './dto/register-post-response.dto';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService
  ) {}

  @Post('register')
  async register(@Body() body: GenerateRequestDto): Promise<ResponsePostDto> {
    try {
      return await this.appService.register(body);
    } catch (error) {
      // Si el error ya es una HttpException, la propagamos tal como está
      if (error instanceof HttpException) {
        throw error;
      }
      
      // Para errores de validación o datos incorrectos
      if (error.message?.includes('validation') || error.message?.includes('invalid')) {
        throw new BadRequestException(error.message || 'Datos de entrada inválidos');
      }
      
      // Para errores internos del servidor (base de datos, servicios externos, etc.)
      throw new InternalServerErrorException('Error interno del servidor');
    }
  }
}
