import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Render } from '@nestjs/common';
import { ClientService } from './client.service';
import { AuthGuard } from '../auth/auth.guard';
import * as crypto from 'crypto';

@Controller('clients')
@UseGuards(AuthGuard)
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Get('manage')
  @Render('clients')
  async renderManagePage() {
    const clients = await this.clientService.findAll();
    return { clients };
  }

  @Post()
  async create(@Body() createClientDto: any) {
    const clientSecret = crypto.randomBytes(32).toString('hex');
    return this.clientService.create({
      ...createClientDto,
      clientSecret,
      grants: createClientDto.grants.split(','),
      redirectUris: createClientDto.redirectUris.split(','),
      scope: createClientDto.scope.split(',')
    });
  }

  @Get()
  async findAll() {
    return this.clientService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.clientService.findOne(+id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateClientDto: any) {
    return this.clientService.update(+id, {
      ...updateClientDto,
      grants: updateClientDto.grants?.split(','),
      redirectUris: updateClientDto.redirectUris?.split(','),
      scope: updateClientDto.scope?.split(',')
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.clientService.remove(+id);
  }

  @Post(':id/regenerate-secret')
  async regenerateSecret(@Param('id') id: string) {
    const clientSecret = crypto.randomBytes(32).toString('hex');
    return this.clientService.update(+id, { clientSecret });
  }
} 