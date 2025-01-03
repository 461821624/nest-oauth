import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { Client } from './entities/client.entity';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    const userRepository = dataSource.getRepository(User);
    const clientRepository = dataSource.getRepository(Client);

    // 创建测试用户
    const password = await bcrypt.hash('123456', 10);
    await userRepository.save({
      username: 'testuser',
      password
    });

    // 创建测试客户端
    await clientRepository.save({
      clientId: 'testclient',
      clientSecret: 'testclientsecret',
      name: 'Test Client',
      grants: ['authorization_code', 'refresh_token', 'password'],
      redirectUris: ['http://localhost:3030/callback'],
      scope: ['read', 'write']
    });

    console.log('测试数据已创建:');
    console.log('用户:', { username: 'testuser', password: '123456' });
    console.log('客户端:', { clientId: 'testclient', clientSecret: 'testclientsecret' });
  } catch (error) {
    console.error('创建测试数据失败:', error);
  }

  await app.close();
}

bootstrap(); 