import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, ArrayMinSize } from 'class-validator';

export class UpdateClientDto {
  @ApiProperty({
    description: '客户端名称',
    example: '测试客户端',
    required: false
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: '授权类型列表',
    example: ['authorization_code', 'refresh_token', 'password'],
    isArray: true,
    required: false
  })
  @IsArray()
  @ArrayMinSize(1, { message: '至少需要一种授权类型' })
  @IsOptional()
  grants?: string[];

  @ApiProperty({
    description: '回调地址列表',
    example: ['http://localhost:3030/callback'],
    isArray: true,
    required: false
  })
  @IsArray()
  @ArrayMinSize(1, { message: '至少需要一个回调地址' })
  @IsOptional()
  redirectUris?: string[];

  @ApiProperty({
    description: '权限范围列表',
    example: ['read', 'write'],
    isArray: true,
    required: false
  })
  @IsArray()
  @ArrayMinSize(1, { message: '至少需要一个权限范围' })
  @IsOptional()
  scope?: string[];
} 