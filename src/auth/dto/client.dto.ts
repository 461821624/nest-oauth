import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsString()
  @IsNotEmpty()
  clientSecret: string;

  @IsArray()
  @IsString({ each: true })
  redirectUris: string[];

  @IsArray()
  @IsString({ each: true })
  grants: string[];

  @IsString()
  @IsOptional()
  description?: string;
} 