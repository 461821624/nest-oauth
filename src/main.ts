import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';

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





  // 配置 CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
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
