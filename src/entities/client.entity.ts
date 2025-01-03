import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { AccessToken } from './access-token.entity';
import { RefreshToken } from './refresh-token.entity';
import { AuthCode } from './auth-code.entity';

@Entity()
export class Client {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  clientId: string;

  @Column()
  clientSecret: string;

  @Column()
  name: string;

  @Column('simple-array')
  grants: string[];

  @Column('simple-array')
  redirectUris: string[];

  @Column('simple-array')
  scope: string[];

  @OneToMany(() => AccessToken, token => token.client)
  accessTokens: AccessToken[];

  @OneToMany(() => RefreshToken, token => token.client)
  refreshTokens: RefreshToken[];

  @OneToMany(() => AuthCode, code => code.client)
  authCodes: AuthCode[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 