import { IsString, IsArray, IsOptional, IsNotEmpty } from 'class-validator';

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
} 