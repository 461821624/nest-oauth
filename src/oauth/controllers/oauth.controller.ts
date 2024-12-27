import { Controller, Get, Post, Body, Query, Render, Res, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { AuthorizeDto, TokenDto, LoginDto, AuthorizeDecisionDto } from '../dto/oauth.dto';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('oauth')
export class OAuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: '获取授权页面' })
  @ApiResponse({ status: 200, description: '返回授权页面' })
  @Get('authorize')
  @Render('authorize')
  async authorize(@Query() query: AuthorizeDto) {
    const client = await this.authService.validateClient(query.client_id);
    return {
      ...query,
      client,
    };
  }

  @ApiOperation({ summary: '获取登录页面' })
  @ApiResponse({ status: 200, description: '返回登录页面' })
  @Get('login')
  @Render('login')
  getLogin(@Query() query: AuthorizeDto) {
    return {
      ...query,
      error: null,
    };
  }

  @ApiOperation({ summary: '用户登录' })
  @ApiResponse({ status: 200, description: '登录成功' })
  @ApiResponse({ status: 401, description: '登录失败' })
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    try {
      const user = await this.authService.validatePassword(
        loginDto.username,
        loginDto.password,
      );
      // TODO: 设置用户会话
      return res.redirect('/oauth/authorize');
    } catch (error) {
      return res.render('login', {
        error: '用户名或密码错误',
      });
    }
  }

  @ApiOperation({ summary: '处理用户授权决定' })
  @ApiResponse({ status: 200, description: '授权处理成功' })
  @Post('authorize/decision')
  async decision(@Body() body: AuthorizeDecisionDto, @Res() res: Response) {
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
      const user = await this.authService.findUserByUsername('testuser');

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      switch (query.response_type) {
        case 'code':
          // 授权码模式
          const code = await this.authService.generateAuthorizationCode(
            user.id,
            query.client_id,
            query.scope,
          );
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

  @ApiOperation({ summary: '获取访问令牌' })
  @ApiResponse({ status: 200, description: '获取令牌成功' })
  @ApiResponse({ status: 400, description: '获取令牌失败' })
  @Post('token')
  async token(@Body() body: TokenDto) {
    const {
      grant_type,
      client_id,
      client_secret,
      code,
      username,
      password,
      refresh_token,
    } = body;

    // 验证客户端
    await this.authService.validateClient(client_id, client_secret);

    switch (grant_type) {
      case 'authorization_code':
        // 授权码模式
        const authCode = await this.authService.validateAuthorizationCode(
          code,
          client_id,
        );
        const accessToken = await this.authService.generateAccessToken({
          sub: authCode.userId,
          clientId: client_id,
          scope: authCode.scope,
        });
        const refreshToken = await this.authService.generateRefreshToken(
          authCode.userId,
          client_id,
        );
        return {
          access_token: accessToken,
          token_type: 'bearer',
          refresh_token: refreshToken,
        };

      case 'password':
        // 密码模式
        console.log('Password grant request:', { username, password });
        try {
          const user = await this.authService.validatePassword(username, password);
          console.log('User validated:', {
            id: user.id,
            username: user.username,
          });

          const passwordAccessToken = await this.authService.generateAccessToken({
            sub: user.id,
            clientId: client_id,
            scope: 'read',
          });
          console.log('Access token generated');

          const passwordRefreshToken = await this.authService.generateRefreshToken(
            user.id,
            client_id,
          );
          console.log('Refresh token generated');

          return {
            access_token: passwordAccessToken,
            token_type: 'bearer',
            refresh_token: passwordRefreshToken,
            scope: 'read',
          };
        } catch (error) {
          console.error('Password grant error:', error);
          throw error;
        }

      case 'client_credentials':
        // 客户端模式
        console.log('Client credentials grant request:', { client_id });
        try {
          const client = await this.authService.validateClient(
            client_id,
            client_secret,
          );
          console.log('Client validated:', { clientId: client.clientId });

          const clientAccessToken = await this.authService.generateAccessToken({
            sub: client_id,
            clientId: client_id,
            scope: 'client',
          });
          console.log('Access token generated for client');

          return {
            access_token: clientAccessToken,
            token_type: 'bearer',
            scope: 'client',
          };
        } catch (error) {
          console.error('Client credentials grant error:', error);
          throw error;
        }

      case 'refresh_token':
        // 刷新令牌
        const refreshTokenData = await this.authService.validateRefreshToken(
          refresh_token,
          client_id,
        );
        const newAccessToken = await this.authService.generateAccessToken({
          sub: refreshTokenData.userId,
          clientId: client_id,
          scope: refreshTokenData.scope,
        });
        const newRefreshToken = await this.authService.generateRefreshToken(
          refreshTokenData.userId,
          client_id,
        );
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