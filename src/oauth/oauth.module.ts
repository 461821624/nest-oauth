import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ClientController } from './controllers/client.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ClientController],
  providers: [],
})
export class OAuthModule {} 