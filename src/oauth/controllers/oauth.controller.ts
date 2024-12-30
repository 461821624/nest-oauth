import { Controller, Get, Post, Body, Query, Render, Res, UnauthorizedException, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { AuthorizeDto, TokenDto, LoginDto, AuthorizeDecisionDto, RevokeTokenDto, TokenInfoDto } from '../dto/oauth.dto';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Session } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('auth')
@Controller('oauth')
export class OAuthController {
  private readonly logger = new Logger(OAuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService
  ) {
    this.logger.log('OAuthController initialized');
  }

  @ApiOperation({ summary: '获取授权页面' })
  @ApiResponse({ status: 200, description: '返回授权页面' })
  @Get('authorize')
  async authorize(
    @Query('response_type') responseType: string,
    @Query('client_id') clientId: string,
    @Query('redirect_uri') redirectUri: string,
    @Query('scope') scope: string,
    @Query('state') state: string,
    @Session() session: Record<string, any>,
    @Res() res: Response
  ) {
    console.log('=== Start authorize method ===');
    console.log('Query params:', { responseType, clientId, redirectUri, scope, state });
    console.log('Session:', session);

    try {
      // 验证请求参数
      if (!responseType || !clientId || !redirectUri) {
        console.log('Missing required parameters');
        throw new BadRequestException('Missing required parameters');
      }

      // 检查用户是否已登录
      if (!session.userId) {
        console.log('User not logged in, redirecting to login page');
        return res.render('login', {
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: responseType,
          scope: scope || '',
          state: state || '',
          error: null
        });
      }

      // 验证客户端
      const client = await this.prisma.client.findFirst({
        where: { clientId }
      });

      if (!client) {
        throw new BadRequestException('Invalid client_id');
      }

      // 验证重定向URI
      if (!client.redirectUris.includes(redirectUri)) {
        throw new BadRequestException('Invalid redirect_uri');
      }

      // 渲染授权页面，确保所有必要的变量都传递
      return res.render('authorize', {
        client,
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: responseType,
        scope: scope || '',
        state: state || '',
        user: {
          id: session.userId,
          username: session.username
        }
      });
    } catch (error) {
      console.error('Authorization error:', error);
      throw new InternalServerErrorException(error.message);
    }
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
  async login(
    @Body() loginDto: any,
    @Session() session: Record<string, any>,
    @Body('client_id') clientId: string,
    @Body('redirect_uri') redirectUri: string,
    @Body('response_type') responseType: string,
    @Body('scope') scope: string,
    @Body('state') state: string,
    @Res() res: Response
  ) {
    try {
      console.log('Login attempt:', { username: loginDto.username });
      
      // 1. 验证用户凭据
      const user = await this.authService.validatePassword(
        loginDto.username,
        loginDto.password
      );

      // 2. 设置会话
      session.userId = user.id;
      session.username = user.username;

      // 3. 重定向回授权页面，使用表单中的隐藏字段值
      const redirectUrl = `/oauth/authorize?${new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: responseType,
        scope: scope || '',
        state: state || ''
      }).toString()}`;

      console.log('Redirecting to:', redirectUrl);
      return res.redirect(redirectUrl);
    } catch (error) {
      // 4. 登录失败处理
      return res.render('login', {
        error: '用户名或密码错误',
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: responseType,
        scope: scope,
        state: state
      });
    }
  }

  @ApiOperation({ summary: '处理用户授权决定' })
  @ApiResponse({ status: 200, description: '授权处理成功' })
  @Post('authorize/decision')
  async decision(
    @Body() body: any,
    @Session() session: Record<string, any>,
    @Res() res: Response
  ) {
    try {
      const { allow, ...query } = body;

      // 1. 检查用户是否已登录
      if (!session.userId) {
        throw new UnauthorizedException('User not logged in');
      }

      // 2. 如果用户拒绝授权
      if (allow === 'false') {
        const errorUrl = new URL(query.redirect_uri);
        errorUrl.searchParams.append('error', 'access_denied');
        if (query.state) {
          errorUrl.searchParams.append('state', query.state);
        }
        return res.redirect(errorUrl.toString());
      }

      // 3. 生成授权码
      const code = await this.authService.generateAuthorizationCode(
        session.userId,
        query.client_id,
        query.scope
      );

      // 4. 构建重定向URL
      const redirectUrl = new URL(query.redirect_uri);
      redirectUrl.searchParams.append('code', code);
      if (query.state) {
        redirectUrl.searchParams.append('state', query.state);
      }

      // 5. 重定向到客户端
      return res.redirect(redirectUrl.toString());
    } catch (error) {
      console.error('Authorization decision error:', error);
      throw new InternalServerErrorException(error.message);
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

  @ApiOperation({ summary: '撤销令牌' })
  @ApiResponse({ status: 200, description: '令牌撤销成功' })
  @ApiResponse({ status: 400, description: '令牌撤销失败' })
  @Post('revoke')
  async revokeToken(@Body() body: RevokeTokenDto) {
    const { token, client_id, client_secret, token_type_hint } = body;

    try {
      // 验证客户端
      await this.authService.validateClient(client_id, client_secret);
      
      // 撤销令牌
      await this.authService.revokeToken(token, client_id, token_type_hint);
      
      return { message: 'Token revoked successfully' };
    } catch (error) {
      throw new UnauthorizedException('Token revocation failed');
    }
  }

  @ApiOperation({ summary: '获取令牌信息' })
  @ApiResponse({ status: 200, description: '获取令牌信息成功' })
  @Post('introspect')
  async getTokenInfo(@Body() body: TokenInfoDto) {
    return this.authService.getTokenInfo(body.token);
  }
} 