import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { AccessToken } from './access-token.entity';
import { RefreshToken } from './refresh-token.entity';
import { AuthCode } from './auth-code.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Client {
  @ApiProperty({ description: '客户端ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '客户端标识符' })
  @Column({ unique: true })
  clientId: string;

  @ApiProperty({ description: '客户端密钥', writeOnly: true })
  @Column()
  clientSecret: string;

  @ApiProperty({ description: '客户端名称' })
  @Column()
  name: string;

  @ApiProperty({ description: '授权类型列表', example: ['authorization_code', 'password'] })
  @Column('simple-array')
  grants: string[];

  @ApiProperty({ description: '回调地址列表', example: ['http://localhost:3030/callback'] })
  @Column('simple-array')
  redirectUris: string[];

  @ApiProperty({ description: '权限范围列表', example: ['read', 'write'] })
  @Column('simple-array')
  scope: string[];

  @OneToMany(() => AccessToken, token => token.client)
  accessTokens: AccessToken[];

  @OneToMany(() => RefreshToken, token => token.client)
  refreshTokens: RefreshToken[];

  @OneToMany(() => AuthCode, code => code.client)
  authCodes: AuthCode[];

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn()
  updatedAt: Date;
} 