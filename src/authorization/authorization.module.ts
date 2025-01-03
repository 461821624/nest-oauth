import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthorizationController } from './authorization.controller';
import { AuthorizationService } from './authorization.service';
import { AccessToken } from '../entities/access-token.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { AuthCode } from '../entities/auth-code.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AccessToken, RefreshToken, AuthCode])],
  controllers: [AuthorizationController],
  providers: [AuthorizationService],
  exports: [AuthorizationService]
})
export class AuthorizationModule {} 