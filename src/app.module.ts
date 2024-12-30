import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OAuthModule } from './oauth/oauth.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        () => ({
          oauth: {
            tokenExpiresIn: 3600, // 访问令牌过期时间（秒）
            refreshTokenExpiresIn: 2592000, // 刷新令牌过期时间（秒）
          },
        }),
      ],
    }),
    PrismaModule,
    OAuthModule,
  ],
})
export class AppModule {}
