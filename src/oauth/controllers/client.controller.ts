import { Controller, Get, Post, Delete, Param, Body, Render } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClientDto } from '../dto/client.dto';
import * as bcrypt from 'bcrypt';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('clients')
@Controller('oauth/clients')
export class ClientController {
  constructor(private prisma: PrismaService) {}

  @ApiOperation({ summary: '初始化测试用户' })
  @ApiResponse({ status: 200, description: '测试用户创建成功' })
  @Get('init')
  async initTestUser() {
    try {
      // 创建测试用户
      const hashedPassword = await bcrypt.hash('password', 10);
      const user = await this.prisma.user.upsert({
        where: { username: 'testuser' },
        update: {},
        create: {
          username: 'testuser',
          email: 'test@example.com',
          password: hashedPassword,
        },
      });

      return {
        message: '测试用户创建成功',
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      };
    } catch (error) {
      console.error('Init test user error:', error);
      return { error: '创建测试用户失败：' + error.message };
    }
  }

  @ApiOperation({ summary: '获取应用列表' })
  @ApiResponse({ status: 200, description: '获取应用列表成功' })
  @Get()
  @Render('clients/index')
  async index() {
    try {
      const clients = await this.prisma.client.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return { 
        clients,
        error: null 
      };
    } catch (error) {
      console.error('List clients error:', error);
      return { 
        clients: [],
        error: '获取应用列表失败：' + error.message 
      };
    }
  }

  @ApiOperation({ summary: '创建新应用页面' })
  @ApiResponse({ status: 200, description: '返回创建新应用的页面' })
  @Get('new')
  @Render('clients/new')
  new() {
    return { error: null };
  }

  @ApiOperation({ summary: '创建新应用' })
  @ApiResponse({ status: 201, description: '应用创建成功' })
  @ApiResponse({ status: 400, description: '创建应用失败' })
  @Post()
  async create(@Body() createClientDto: CreateClientDto) {
    try {
      // 获取测试用户
      const user = await this.prisma.user.findUnique({
        where: { username: 'testuser' }
      });

      if (!user) {
        return { error: '请先创建测试用户' };
      }

      const client = await this.prisma.client.create({
        data: {
          name: createClientDto.name,
          clientId: createClientDto.clientId,
          clientSecret: createClientDto.clientSecret,
          redirectUris: createClientDto.redirectUris,
          grants: createClientDto.grants,
          userId: user.id
        },
      });
      return { id: client.id };
    } catch (error) {
      console.error('Create client error:', error);
      return { error: '创建应用失败：' + error.message };
    }
  }

  @ApiOperation({ summary: '获取应用详情' })
  @ApiParam({ name: 'id', description: '应用ID' })
  @ApiResponse({ status: 200, description: '获取应用详情成功' })
  @ApiResponse({ status: 404, description: '应用不存在' })
  @Get(':id')
  @Render('clients/show')
  async show(@Param('id') id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
    });
    if (!client) {
      return { error: '应用不存在' };
    }
    return { client };
  }

  @ApiOperation({ summary: '删除应用' })
  @ApiParam({ name: 'id', description: '应用ID' })
  @ApiResponse({ status: 200, description: '应用删除成功' })
  @ApiResponse({ status: 404, description: '应用不存在' })
  @Delete(':id')
  async delete(@Param('id') id: string) {
    try {
      await this.prisma.client.delete({
        where: { id },
      });
      return { success: true };
    } catch (error) {
      console.error('Delete client error:', error);
      return { error: '删除应用失败：' + error.message };
    }
  }
} 