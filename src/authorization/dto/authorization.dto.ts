import { ApiProperty } from '@nestjs/swagger';

export class AuthorizationDto {
  @ApiProperty({
    description: '授权ID',
    example: 1
  })
  id: number;

  @ApiProperty({
    description: '客户端ID',
    example: 'testclient'
  })
  clientId: string;

  @ApiProperty({
    description: '客户端名称',
    example: '测试客户端'
  })
  clientName: string;

  @ApiProperty({
    description: '权限范围列表',
    example: ['read', 'write'],
    isArray: true
  })
  scope: string[];

  @ApiProperty({
    description: '授权时间',
    example: '2024-01-01T00:00:00.000Z'
  })
  createdAt: Date;
} 