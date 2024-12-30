import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'path';
import * as session from 'express-session';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  
  // 添加全局路由前缀（如果有）
  // app.setGlobalPrefix('api');

  // 打印路由信息
  const server = app.getHttpServer();
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // 启用 Helmet 安全头，在开发环境中禁用 CSP
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

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
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: true
  });

  // 配置 Swagger 文档
  const config = new DocumentBuilder()
    .setTitle('NestJS OAuth 2.0 API')
    .setDescription('OAuth 2.0 授权服务器 API 文档')
    .setVersion('1.0')
    .addTag('auth', 'OAuth 2.0 认证相关接口')
    .addTag('clients', 'OAuth 客户端应用管理接口')
    .addTag('users', '用户管理接口')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // 配置模板引擎
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('ejs');

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
