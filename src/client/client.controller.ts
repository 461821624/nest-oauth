import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Render } from '@nestjs/common';
import { ClientService } from './client.service';
import { AuthGuard } from '../auth/auth.guard';
import * as crypto from 'crypto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('client')
@ApiBearerAuth()
@Controller('clients')
@UseGuards(AuthGuard)
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Get('manage')
  @ApiOperation({ summary: '获取客户端管理页面', description: '返回客户端管理页面的HTML' })
  @ApiResponse({ status: 200, description: '返回客户端管理页面' })
  @Render('clients')
  async renderManagePage() {
    const clients = await this.clientService.findAll();
    return { clients };
  }

  @Post()
  @ApiOperation({ summary: '创建新客户端', description: '创建一个新的OAuth2.0客户端应用' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'grants', 'redirectUris', 'scope'],
      properties: {
        name: {
          type: 'string',
          description: '客户端名称'
        },
        grants: {
          type: 'string',
          description: '授权类型，多个用逗号分隔',
          example: 'authorization_code,refresh_token,password'
        },
        redirectUris: {
          type: 'string',
          description: '回调地址，多个用逗号分隔',
          example: 'http://localhost:3030/callback'
        },
        scope: {
          type: 'string',
          description: '权限范围，多个用逗号分隔',
          example: 'read,write'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: '客户端创建成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        clientId: { type: 'string' },
        clientSecret: { type: 'string' },
        name: { type: 'string' },
        grants: { type: 'array', items: { type: 'string' } },
        redirectUris: { type: 'array', items: { type: 'string' } },
        scope: { type: 'array', items: { type: 'string' } }
      }
    }
  })
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
  @ApiOperation({ summary: '获取所有客户端', description: '获取所有OAuth2.0客户端应用列表' })
  @ApiResponse({
    status: 200,
    description: '成功获取客户端列表',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          clientId: { type: 'string' },
          name: { type: 'string' },
          grants: { type: 'array', items: { type: 'string' } },
          redirectUris: { type: 'array', items: { type: 'string' } },
          scope: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  })
  async findAll() {
    return this.clientService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个客户端', description: '根据ID获取特定的OAuth2.0客户端应用' })
  @ApiResponse({
    status: 200,
    description: '成功获取客户端信息',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        clientId: { type: 'string' },
        name: { type: 'string' },
        grants: { type: 'array', items: { type: 'string' } },
        redirectUris: { type: 'array', items: { type: 'string' } },
        scope: { type: 'array', items: { type: 'string' } }
      }
    }
  })
  @ApiResponse({ status: 404, description: '客户端不存在' })
  async findOne(@Param('id') id: string) {
    return this.clientService.findOne(+id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新客户端', description: '更新特定的OAuth2.0客户端应用信息' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: '客户端名称'
        },
        grants: {
          type: 'string',
          description: '授权类型，多个用逗号分隔'
        },
        redirectUris: {
          type: 'string',
          description: '回调地址，多个用逗号分隔'
        },
        scope: {
          type: 'string',
          description: '权限范围，多个用逗号分隔'
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: '客户端更新成功' })
  @ApiResponse({ status: 404, description: '客户端不存在' })
  async update(@Param('id') id: string, @Body() updateClientDto: any) {
    return this.clientService.update(+id, {
      ...updateClientDto,
      grants: updateClientDto.grants?.split(','),
      redirectUris: updateClientDto.redirectUris?.split(','),
      scope: updateClientDto.scope?.split(',')
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除客户端', description: '删除特定的OAuth2.0客户端应用' })
  @ApiResponse({ status: 200, description: '客户端删除成功' })
  @ApiResponse({ status: 404, description: '客户端不存在' })
  async remove(@Param('id') id: string) {
    return this.clientService.remove(+id);
  }

  @Post(':id/regenerate-secret')
  @ApiOperation({ summary: '重新生成客户端密钥', description: '为特定的OAuth2.0客户端应用重新生成密钥' })
  @ApiResponse({
    status: 200,
    description: '客户端密钥重新生成成功',
    schema: {
      type: 'object',
      properties: {
        clientSecret: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 404, description: '客户端不存在' })
  async regenerateSecret(@Param('id') id: string) {
    const clientSecret = crypto.randomBytes(32).toString('hex');
    return this.clientService.update(+id, { clientSecret });
  }
} 