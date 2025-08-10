import { IsString, IsOptional, IsObject, ValidateIf } from 'class-validator';

export class GenerateRequestDto {
  @IsString()
  vcardType: string;

  @IsString()
  @IsOptional()
  imageBase64?: string;

  @IsString()
  @ValidateIf((o) => !!o.imageBase64)
  imageName?: string;

  @IsString()
  @ValidateIf((o) => !!o.imageBase64)
  imageType?: string;

  @IsObject()
  data: Record<string, any>;
}
