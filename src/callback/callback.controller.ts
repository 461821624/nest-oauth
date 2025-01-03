import { Controller, Get, Query, Render } from '@nestjs/common';

@Controller()
export class CallbackController {
  @Get('callback')
  @Render('callback')
  getCallback(@Query('code') code: string, @Query('state') state: string) {
    return { code, state };
  }
} 