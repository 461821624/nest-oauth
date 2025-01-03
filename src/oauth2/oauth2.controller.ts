import { Controller, Get, Post, Req, Res, Session, Body, Render } from '@nestjs/common';
import { Request, Response } from 'express';
import { OAuth2Service } from './oauth2.service';
import * as OAuth2Server from 'oauth2-server';

@Controller('oauth')
export class OAuth2Controller {
  constructor(private readonly oauth2Service: OAuth2Service) {}

  @Get('authorize')
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