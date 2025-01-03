import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { OAuth2Module } from './oauth2/oauth2.module';
import { ClientModule } from './client/client.module';
import { AuthorizationModule } from './authorization/authorization.module';
import { User } from './entities/user.entity';
import { Client } from './entities/client.entity';
import { AccessToken } from './entities/access-token.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { AuthCode } from './entities/auth-code.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '123456',
      database: 'oauth2',
      entities: [User, Client, AccessToken, RefreshToken, AuthCode],
      synchronize: true,
    }),
    AuthModule,
    OAuth2Module,
    ClientModule,
    AuthorizationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
