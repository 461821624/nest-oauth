import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { AccessToken } from './access-token.entity';
import { RefreshToken } from './refresh-token.entity';
import { AuthCode } from './auth-code.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class User {
  @ApiProperty({ description: '用户ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: '用户名' })
  @Column({ unique: true })
  username: string;

  @ApiProperty({ description: '密码', writeOnly: true })
  @Column()
  password: string;

  @ApiProperty({ description: '邮箱', required: false })
  @Column({ nullable: true })
  email: string;

  @ApiProperty({ description: '昵称', required: false })
  @Column({ nullable: true })
  nickname: string;

  @OneToMany(() => AccessToken, token => token.user)
  accessTokens: AccessToken[];

  @OneToMany(() => RefreshToken, token => token.user)
  refreshTokens: RefreshToken[];

  @OneToMany(() => AuthCode, code => code.user)
  authCodes: AuthCode[];

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn()
  updatedAt: Date;
} 