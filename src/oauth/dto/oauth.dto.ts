import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AuthorizeDto {
  @ApiProperty({ description: '客户端ID' })
  @IsString()
  @IsNotEmpty()
  client_id: string;

  @ApiProperty({ description: '响应类型', enum: ['code', 'token'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['code', 'token'])
  response_type: string;

  @ApiProperty({ description: '重定向URI' })
  @IsString()
  @IsNotEmpty()
  redirect_uri: string;

  @ApiProperty({ description: '权限范围', required: false })
  @IsString()
  @IsOptional()
  scope?: string;

  @ApiProperty({ description: '状态值', required: false })
  @IsString()
  @IsOptional()
  state?: string;
}

export class TokenDto {
  @ApiProperty({ description: '授权类型', enum: ['authorization_code', 'password', 'client_credentials', 'refresh_token'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['authorization_code', 'password', 'client_credentials', 'refresh_token'])
  grant_type: string;

  @ApiProperty({ description: '客户端ID' })
  @IsString()
  @IsNotEmpty()
  client_id: string;

  @ApiProperty({ description: '客户端密钥' })
  @IsString()
  @IsNotEmpty()
  client_secret: string;

  @ApiProperty({ description: '授权码', required: false })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({ description: '重定向URI', required: false })
  @IsString()
  @IsOptional()
  redirect_uri?: string;

  @ApiProperty({ description: '用户名', required: false })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty({ description: '密码', required: false })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiProperty({ description: '刷新令牌', required: false })
  @IsString()
  @IsOptional()
  refresh_token?: string;

  @ApiProperty({ description: '权限范围', required: false })
  @IsString()
  @IsOptional()
  scope?: string;
}

export class LoginDto {
  @ApiProperty({ description: '用户名' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: '密码' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class AuthorizeDecisionDto {
  @ApiProperty({ description: '是否允许授权', default: true })
  @IsString()
  @IsNotEmpty()
  allow: string;

  @ApiProperty({ description: '客户端ID' })
  @IsString()
  @IsNotEmpty()
  client_id: string;

  @ApiProperty({ description: '重定向URI' })
  @IsString()
  @IsNotEmpty()
  redirect_uri: string;

  @ApiProperty({ description: '响应类型' })
  @IsString()
  @IsNotEmpty()
  response_type: string;

  @ApiProperty({ description: '状态值', required: false })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ description: '权限范围', required: false })
  @IsString()
  @IsOptional()
  scope?: string;
} 