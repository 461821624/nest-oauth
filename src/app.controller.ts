import { Controller, Get, Query, Render } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('app')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: '首页', description: '返回应用首页' })
  @Render('index')
  getIndex() {
    return {};
  }

  @Get('error')
  @ApiOperation({ summary: '错误页面', description: '显示错误信息页面' })
  @ApiQuery({ name: 'status', required: true, description: '错误状态码' })
  @ApiQuery({ name: 'message', required: true, description: '错误信息' })
  @Render('error')
  getError(@Query('status') status: string, @Query('message') message: string) {
    return { status, message };
  }
}
