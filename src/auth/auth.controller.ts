import { Controller, Post, Body, Get, Query, UseGuards, Req, Res, UnauthorizedException, Render } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthorizeDto, TokenDto } from './dto/oauth.dto';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@Controller('oauth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('init')
  async initTestData() {
    try {
      // 创建测试用户
      const plainPassword = 'password';
      const hashedPassword = await this.authService.hashPassword(plainPassword);
      console.log('Password hashing:', {
        plain: plainPassword,
        hashed: hashedPassword
      });

      const user = await this.prisma.user.upsert({
        where: { username: 'testuser' },
        update: {
          password: hashedPassword
        },
        create: {
          username: 'testuser',
          email: 'test@example.com',
          password: hashedPassword,
        },
      });

      console.log('Created/Updated user:', { 
        id: user.id, 
        username: user.username,
        passwordHash: user.password 
      });

      // 创建测试客户端
      const client = await this.prisma.client.upsert({
        where: { clientId: 'test-client' },
        update: {},
        create: {
          clientId: 'test-client',
          clientSecret: 'test-secret',
          name: '测试应用',
          redirectUris: ['http://localhost:3001/callback'],
          grants: ['authorization_code', 'password', 'client_credentials', 'refresh_token'],
          userId: user.id,
        },
      });

      return { 
        message: '测试数据初始化成功',
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        },
        client: {
          id: client.id,
          clientId: client.clientId,
          name: client.name
        }
      };
    } catch (error) {
      console.error('Init data error:', error);
      throw error;
    }
  }

  @Get('login')
  @Render('login')
  getLogin(@Query() query: AuthorizeDto) {
    return {
      client_id: query.client_id,
      redirect_uri: query.redirect_uri,
      response_type: query.response_type,
      scope: query.scope,
      state: query.state,
      error: null,
    };
  }

  @Post('login')
  async postLogin(@Body() body: any, @Res() res: Response) {
    try {
      const user = await this.authService.validatePassword(body.username, body.password);
      // TODO: 设置用户会话
      return res.redirect(`/oauth/authorize?${new URLSearchParams(body).toString()}`);
    } catch (error) {
      return res.render('login', {
        ...body,
        error: '用户名或密码错误',
      });
    }
  }

  @Get('authorize')
  @Render('authorize')
  async getAuthorize(@Query() query: AuthorizeDto) {
    const client = await this.authService.validateClient(query.client_id, '');
    return {
      ...query,
      client,
    };
  }

  @Post('authorize/decision')
  async postAuthorizeDecision(@Body() body: any, @Res() res: Response) {
    const { allow, ...query } = body;
    
    if (allow === 'false') {
      const errorUrl = new URL(query.redirect_uri);
      errorUrl.searchParams.append('error', 'access_denied');
      if (query.state) {
        errorUrl.searchParams.append('state', query.state);
      }
      return res.redirect(errorUrl.toString());
    }

    try {
      // 获取测试用户
      const user = await this.prisma.user.findUnique({
        where: { username: 'testuser' },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      switch (query.response_type) {
        case 'code':
          // 授权码模式
          const code = await this.authService.generateAuthorizationCode(user.id, query.client_id, query.scope);
          const redirectUrl = new URL(query.redirect_uri);
          redirectUrl.searchParams.append('code', code);
          if (query.state) {
            redirectUrl.searchParams.append('state', query.state);
          }
          return res.redirect(redirectUrl.toString());

        case 'token':
          // 简化模式
          const accessToken = await this.authService.generateAccessToken({
            sub: user.id,
            clientId: query.client_id,
            scope: query.scope,
          });
          const implicitRedirectUrl = new URL(query.redirect_uri);
          implicitRedirectUrl.hash = `access_token=${accessToken}&token_type=bearer`;
          if (query.state) {
            implicitRedirectUrl.hash += `&state=${query.state}`;
          }
          return res.redirect(implicitRedirectUrl.toString());

        default:
          throw new UnauthorizedException('Invalid response type');
      }
    } catch (error) {
      console.error('Authorization error:', error);
      const errorUrl = new URL(query.redirect_uri);
      errorUrl.searchParams.append('error', 'server_error');
      if (query.state) {
        errorUrl.searchParams.append('state', query.state);
      }
      return res.redirect(errorUrl.toString());
    }
  }

  @Post('token')
  async token(@Body() body: TokenDto) {
    const { grant_type, client_id, client_secret, code, username, password, refresh_token } = body;

    // 验证客户端
    await this.authService.validateClient(client_id, client_secret);

    switch (grant_type) {
      case 'authorization_code':
        // 授权码模式
        const authCode = await this.authService.validateAuthorizationCode(code, client_id);
        const accessToken = await this.authService.generateAccessToken({
          sub: authCode.userId,
          clientId: client_id,
          scope: authCode.scope,
        });
        const refreshToken = await this.authService.generateRefreshToken(authCode.userId, client_id);
        return {
          access_token: accessToken,
          token_type: 'bearer',
          refresh_token: refreshToken,
        };

      case 'password':
        // 密码模式
        console.log('Password grant request:', { username, password });
        try {
          // 先验证客户端
          const client = await this.authService.validateClient(client_id, client_secret);
          console.log('Client validated:', { clientId: client.clientId });

          // 再验证用户
          const user = await this.authService.validatePassword(username, password);
          console.log('User validated:', { id: user.id, username: user.username });
          
          // 生成令牌
          const passwordAccessToken = await this.authService.generateAccessToken({
            sub: user.id,
            clientId: client_id,
            scope: 'read'
          });
          console.log('Access token generated');

          // 生成刷新令牌
          const passwordRefreshToken = await this.authService.generateRefreshToken(user.id, client_id);
          console.log('Refresh token generated');
          
          return {
            access_token: passwordAccessToken,
            token_type: 'bearer',
            refresh_token: passwordRefreshToken,
            scope: 'read'
          };
        } catch (error) {
          console.error('Password grant error:', error);
          throw error;
        }

      case 'client_credentials':
        // 客户端模式
        console.log('Client credentials grant request:', { client_id });
        try {
          // 验证客户端
          const client = await this.authService.validateClient(client_id, client_secret);
          console.log('Client validated:', { clientId: client.clientId });

          // 生成访问令牌
          const clientAccessToken = await this.authService.generateAccessToken({
            sub: client_id, // 在客户端模式中，sub 就是 client_id
            clientId: client_id,
            scope: 'client'
          });
          console.log('Access token generated for client');

          return {
            access_token: clientAccessToken,
            token_type: 'bearer',
            scope: 'client'
          };
        } catch (error) {
          console.error('Client credentials grant error:', error);
          throw error;
        }

      case 'refresh_token':
        // 刷新令牌
        const refreshTokenData = await this.authService.validateRefreshToken(refresh_token, client_id);
        const newAccessToken = await this.authService.generateAccessToken({
          sub: refreshTokenData.userId,
          clientId: client_id,
          scope: refreshTokenData.scope,
        });
        const newRefreshToken = await this.authService.generateRefreshToken(refreshTokenData.userId, client_id);
        return {
          access_token: newAccessToken,
          token_type: 'bearer',
          refresh_token: newRefreshToken,
        };

      default:
        throw new UnauthorizedException('Invalid grant type');
    }
  }
} 