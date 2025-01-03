import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, IsEmail } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    description: '密码',
    example: '123456',
    minLength: 6,
    required: false
  })
  @IsString()
  @IsOptional()
  @MinLength(6, { message: '密码长度不能小于6位' })
  password?: string;

  @ApiProperty({
    description: '邮箱',
    example: 'john@example.com',
    required: false
  })
  @IsEmail({}, { message: '邮箱格式不正确' })
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: '昵称',
    example: 'John Doe',
    required: false
  })
  @IsString()
  @IsOptional()
  nickname?: string;
} 