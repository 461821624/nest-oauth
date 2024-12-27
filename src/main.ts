import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
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
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(3000);
}
bootstrap();
