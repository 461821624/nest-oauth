import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OAuth2Controller } from './oauth2.controller';
import { OAuth2Service } from './oauth2.service';
import { User } from '../entities/user.entity';
import { Client } from '../entities/client.entity';
import { AuthCode } from '../entities/auth-code.entity';
import { AccessToken } from '../entities/access-token.entity';
import { RefreshToken } from '../entities/refresh-token.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Client,
      AuthCode,
      AccessToken,
      RefreshToken
    ])
  ],
  controllers: [OAuth2Controller],
  providers: [OAuth2Service],
  exports: [OAuth2Service]
})
export class OAuth2Module {} 