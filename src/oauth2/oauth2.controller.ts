import { Controller, Get, Post, Req, Res, Session, Body, Render } from '@nestjs/common';
import { Request, Response } from 'express';
import { OAuth2Service } from './oauth2.service';
import * as OAuth2Server from 'oauth2-server';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';

@ApiTags('oauth2')
@Controller('oauth')
export class OAuth2Controller {
  constructor(private readonly oauth2Service: OAuth2Service) {}

  @Get('authorize')
  @ApiOperation({ summary: '获取授权码', description: '授权码模式的授权端点' })
  @ApiQuery({ name: 'response_type', required: true, enum: ['code'], description: '响应类型' })
  @ApiQuery({ name: 'client_id', required: true, description: '客户端ID' })
  @ApiQuery({ name: 'redirect_uri', required: true, description: '回调地址' })
  @ApiQuery({ name: 'scope', required: true, description: '请求的权限范围' })
  @ApiQuery({ name: 'state', required: false, description: '状态值，用于防止CSRF攻击' })
  @ApiResponse({ status: 302, description: '重定向到登录页面或授权确认页面' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  async authorize(@Req() req: Request, @Res() res: Response, @Session() session: any) {
    try {
      if (!session.userId) {
        const redirectUrl = `/auth/login?redirect=${encodeURIComponent(req.url)}`;
        return res.redirect(redirectUrl);
      }

      const client = await this.oauth2Service.getClient(req.query.client_id as string, null);
      if (!client) {
        throw new Error('Invalid client');
      }

      // 将授权请求参数存储在会话中
      session.authRequest = {
        response_type: req.query.response_type,
        client_id: req.query.client_id,
        redirect_uri: req.query.redirect_uri,
        scope: req.query.scope,
        state: req.query.state
      };

      // 渲染授权确认页面
      return res.render('authorize', {
        client,
        redirectUri: req.query.redirect_uri,
        scopes: (req.query.scope as string).split(' '),
        scopeString: req.query.scope,
        state: req.query.state,
        authRequest: session.authRequest
      });
    } catch (error) {
      console.error('Authorization Error:', error);
      res.status(error.code || 500).json({
        error: error.name,
        error_description: error.message
      });
    }
  }

  @Post('authorize/decision')
  @ApiOperation({ summary: '处理授权决定', description: '处理用户的授权确认或拒绝' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        allow: {
          type: 'string',
          enum: ['true', 'false'],
          description: '用户是否同意授权'
        }
      }
    }
  })
  @ApiResponse({ status: 302, description: '重定向到客户端，带有授权码或错误信息' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  async decision(@Body() body: any, @Session() session: any, @Res() res: Response) {
    try {
      const authRequest = session.authRequest;
      if (!authRequest) {
        throw new Error('No authorization request found');
      }

      // 如果用户拒绝授权
      if (body.allow === 'false') {
        const redirectUrl = new URL(authRequest.redirect_uri);
        redirectUrl.searchParams.set('error', 'access_denied');
        redirectUrl.searchParams.set('error_description', 'The user denied the authorization request');
        if (authRequest.state) {
          redirectUrl.searchParams.set('state', authRequest.state);
        }
        return res.redirect(redirectUrl.toString());
      }

      // 如果用户允许授权
      const request = new OAuth2Server.Request({
        method: 'GET',
        query: {
          response_type: authRequest.response_type,
          client_id: authRequest.client_id,
          redirect_uri: authRequest.redirect_uri,
          scope: authRequest.scope,
          state: authRequest.state
        },
        headers: {
          'content-type': 'application/x-www-form-urlencoded'
        }
      });
      const response = new OAuth2Server.Response(res);

      const client = await this.oauth2Service.getClient(authRequest.client_id, null);
      if (!client) {
        throw new Error('Invalid client');
      }

      const code = await this.oauth2Service.generateAuthorizationCode(
        client,
        { id: session.userId },
        authRequest.scope
      );

      const authCode = await this.oauth2Service.saveAuthorizationCode(
        {
          authorizationCode: code,
          expiresAt: new Date(Date.now() + 600000),
          redirectUri: authRequest.redirect_uri,
          scope: authRequest.scope
        },
        client,
        { id: session.userId }
      );

      // 清除会话中的授权请求
      delete session.authRequest;

      const redirectUrl = new URL(authRequest.redirect_uri);
      redirectUrl.searchParams.set('code', authCode.code);
      if (authRequest.state) {
        redirectUrl.searchParams.set('state', authRequest.state);
      }

      return res.redirect(redirectUrl.toString());
    } catch (error) {
      console.error('Authorization Decision Error:', error);
      res.status(error.code || 500).json({
        error: error.name,
        error_description: error.message
      });
    }
  }

  @Post('token')
  @ApiOperation({ summary: '获取访问令牌', description: '令牌端点，支持多种授权类型' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['grant_type'],
      properties: {
        grant_type: {
          type: 'string',
          enum: ['authorization_code', 'password', 'client_credentials', 'refresh_token'],
          description: '授权类型'
        },
        code: {
          type: 'string',
          description: '授权码（authorization_code模式必需）'
        },
        redirect_uri: {
          type: 'string',
          description: '回调地址（authorization_code模式必需）'
        },
        username: {
          type: 'string',
          description: '用户名（password模式必需）'
        },
        password: {
          type: 'string',
          description: '密码（password模式必需）'
        },
        refresh_token: {
          type: 'string',
          description: '刷新令牌（refresh_token模式必需）'
        },
        scope: {
          type: 'string',
          description: '请求的权限范围'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: '成功获取访问令牌',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: '访问令牌'
        },
        token_type: {
          type: 'string',
          example: 'Bearer',
          description: '令牌类型'
        },
        expires_in: {
          type: 'number',
          example: 3600,
          description: '过期时间（秒）'
        },
        refresh_token: {
          type: 'string',
          description: '刷新令牌'
        },
        scope: {
          type: 'string',
          description: '授权范围'
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '认证失败' })
  async token(@Req() req: Request, @Res() res: Response) {
    try {
      const request = new OAuth2Server.Request({
        method: 'POST',
        body: req.body,
        query: {},
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          ...req.headers
        }
      });
      const response = new OAuth2Server.Response(res);

      const token = await this.oauth2Service.server.token(request, response);
      res.json(token);
    } catch (error) {
      console.error('Token Error:', error);
      res.status(error.code || 500).json({
        error: error.name,
        error_description: error.message
      });
    }
  }

  @Post('verify')
  @ApiOperation({ summary: '验证访问令牌', description: '验证访问令牌的有效性并返回相关信息' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          description: '要验证的访问令牌'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: '令牌验证成功',
    schema: {
      type: 'object',
      properties: {
        active: {
          type: 'boolean',
          example: true,
          description: '令牌是否有效'
        },
        scope: {
          type: 'string',
          description: '令牌的权限范围'
        },
        client: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '客户端ID' },
            name: { type: 'string', description: '客户端名称' }
          }
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', description: '用户ID' },
            username: { type: 'string', description: '用户名' }
          }
        },
        exp: {
          type: 'number',
          description: '过期时间戳'
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: '令牌无效或已过期' })
  async verify(@Req() req: Request, @Res() res: Response) {
    try {
      const request = new OAuth2Server.Request({
        method: 'POST',
        query: {},
        body: req.body,
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          ...req.headers
        }
      });
      const response = new OAuth2Server.Response(res);

      const token = await this.oauth2Service.server.authenticate(request, response);
      res.json({
        active: true,
        scope: token.scope,
        client: {
          id: token.client.clientId,
          name: token.client.name
        },
        user: {
          id: token.user.id,
          username: token.user.username
        },
        exp: token.accessTokenExpiresAt.getTime() / 1000
      });
    } catch (error) {
      console.error('Verification Error:', error);
      res.status(error.code || 401).json({
        active: false,
        error: error.name,
        error_description: error.message
      });
    }
  }
} 