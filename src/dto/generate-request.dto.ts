import { IsString, IsOptional, IsObject } from 'class-validator';

export class GenerateRequestDto {
  @IsString()
  @IsOptional()
  vcardType?: string;

  @IsObject()
  data: Record<string, any>;
}
