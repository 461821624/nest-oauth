import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, IsEmail, IsOptional } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: '用户名',
    example: 'johndoe',
    minLength: 4
  })
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  @MinLength(4, { message: '用户名长度不能小于4位' })
  username: string;

  @ApiProperty({
    description: '密码',
    example: '123456',
    minLength: 6
  })
  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码长度不能小于6位' })
  password: string;

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