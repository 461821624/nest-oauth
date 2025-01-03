import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as session from 'express-session';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  
  // 配置 Swagger
  const config = new DocumentBuilder()
    .setTitle('OAuth2.0 授权服务器')
    .setDescription('基于 NestJS 实现的 OAuth2.0 授权服务器 API 文档')
    .setVersion('1.0')
    .addTag('auth', '用户认证相关接口')
    .addTag('oauth2', 'OAuth2.0 授权相关接口')
    .addTag('client', '客户端应用管理接口')
    .addTag('authorizations', '用户授权管理接口')
    .addTag('user', '用户管理接口')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: '输入访问令牌',
        in: 'header',
      },
      'access-token',
    )
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  // 打印路由信息
  const server = app.getHttpServer();
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // 配置视图引擎
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('ejs');

  // 配置会话
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'my-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 24小时
      }
    })
  );

  // 配置 CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3030',
    credentials: true
  });

  // 配置全局验证管道
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: true
    }
  }));



  await app.listen(3000);
}
bootstrap();
