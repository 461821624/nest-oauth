import { IsString, IsArray, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClientDto {
  @ApiProperty({ description: '应用名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '客户端ID' })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({ description: '客户端密钥' })
  @IsString()
  @IsNotEmpty()
  clientSecret: string;

  @ApiProperty({ description: '重定向URI列表', type: [String] })
  @IsArray()
  @IsString({ each: true })
  redirectUris: string[];

  @ApiProperty({ description: '授权类型列表', type: [String] })
  @IsArray()
  @IsString({ each: true })
  grants: string[];
} 