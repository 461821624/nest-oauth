import { Controller, Get, Delete, UseGuards, Session, Param, Render } from '@nestjs/common';
import { AuthorizationService } from './authorization.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('authorizations')
@UseGuards(AuthGuard)
export class AuthorizationController {
  constructor(private readonly authorizationService: AuthorizationService) {}

  @Get('manage')
  @Render('authorizations')
  async renderManagePage(@Session() session: any) {
    const authorizations = await this.authorizationService.findAllByUser(session.userId);
    return { authorizations };
  }

  @Get()
  async findAll(@Session() session: any) {
    return this.authorizationService.findAllByUser(session.userId);
  }

  @Delete(':clientId')
  async revoke(@Session() session: any, @Param('clientId') clientId: string) {
    return this.authorizationService.revokeAccess(session.userId, clientId);
  }
} 