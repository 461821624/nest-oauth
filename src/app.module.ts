import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerStorageService } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { OAuthModule } from './oauth/oauth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([{
      limit: 10,
      ttl: 60000,
    }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    OAuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ThrottlerStorageService,
  ],
})
export class AppModule {}
