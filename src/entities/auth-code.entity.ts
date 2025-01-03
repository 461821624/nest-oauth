import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { Client } from './client.entity';

@Entity()
export class AuthCode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  expiresAt: Date;

  @Column()
  redirectUri: string;

  @Column('simple-array')
  scope: string[];

  @ManyToOne(() => User, user => user.authCodes)
  user: User;

  @Column()
  userId: number;

  @ManyToOne(() => Client, client => client.authCodes)
  client: Client;

  @Column()
  clientId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 