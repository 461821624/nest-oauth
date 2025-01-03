import { Controller, Get, Delete, UseGuards, Session, Param, Render } from '@nestjs/common';
import { AuthorizationService } from './authorization.service';
import { AuthGuard } from '../auth/auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('authorizations')
@ApiBearerAuth()
@Controller('authorizations')
@UseGuards(AuthGuard)
export class AuthorizationController {
  constructor(private readonly authorizationService: AuthorizationService) {}

  @Get('manage')
  @ApiOperation({ summary: '获取授权管理页面', description: '返回用户的授权管理页面HTML' })
  @ApiResponse({ status: 200, description: '返回授权管理页面' })
  @Render('authorizations')
  async renderManagePage(@Session() session: any) {
    const authorizations = await this.authorizationService.findAllByUser(session.userId);
    return { authorizations };
  }

  @Get()
  @ApiOperation({ summary: '获取用户的所有授权', description: '获取当前用户的所有OAuth2.0授权列表' })
  @ApiResponse({
    status: 200,
    description: '成功获取授权列表',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          clientId: { type: 'string' },
          clientName: { type: 'string' },
          scope: { type: 'array', items: { type: 'string' } },
          createdAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  })
  async findAll(@Session() session: any) {
    return this.authorizationService.findAllByUser(session.userId);
  }

  @Delete(':clientId')
  @ApiOperation({ summary: '撤销授权', description: '撤销用户对特定客户端的授权' })
  @ApiResponse({ status: 200, description: '授权撤销成功' })
  @ApiResponse({ status: 404, description: '授权不存在' })
  async revoke(@Session() session: any, @Param('clientId') clientId: string) {
    return this.authorizationService.revokeAccess(session.userId, clientId);
  }
} 