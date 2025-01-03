import { Controller, Get, Post, Render, Req, Res, Body, Session } from '@nestjs/common';
import { Response, Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  @Get('login')
  @Render('login')
  getLogin(@Req() req: Request): { redirect: string; error: string | undefined } {
    return { 
      redirect: req.query.redirect as string || '/',
      error: req.query.error as string
    };
  }

  @Post('login')
  async postLogin(
    @Body() body: { username: string; password: string; redirect: string },
    @Session() session: any,
    @Res() res: Response
  ) {
    const user = await this.userRepository.findOne({
      where: { username: body.username }
    });

    if (!user) {
      return res.redirect(`/auth/login?error=${encodeURIComponent('用户名或密码错误')}&redirect=${encodeURIComponent(body.redirect)}`);
    }

    const isValid = await bcrypt.compare(body.password, user.password);
    if (!isValid) {
      return res.redirect(`/auth/login?error=${encodeURIComponent('用户名或密码错误')}&redirect=${encodeURIComponent(body.redirect)}`);
    }

    session.userId = user.id;
    res.redirect(body.redirect || '/');
  }

  @Get('logout')
  logout(@Session() session: any, @Res() res: Response) {
    session.userId = null;
    res.redirect('/');
  }
} 