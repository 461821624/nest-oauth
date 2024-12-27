import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as csrf from 'csrf';
import { Session } from 'express-session';

// 扩展 Session 接口
interface CustomSession extends Session {
  csrfSecret?: string;
}

interface RequestWithSession extends Request {
  session: CustomSession;
}

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private tokens = new csrf();

  use(req: RequestWithSession, res: Response, next: NextFunction) {
    // 跳过不需要 CSRF 保护的路由
    if (this.shouldSkip(req)) {
      return next();
    }

    const token = req.headers['x-csrf-token'] || req.body._csrf;
    const secret = req.session?.csrfSecret;

    if (!secret) {
      // 生成新的 CSRF 令牌
      const secret = this.tokens.secretSync();
      const token = this.tokens.create(secret);
      
      req.session.csrfSecret = secret;
      res.cookie('XSRF-TOKEN', token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      return next();
    }

    // 验证 CSRF 令牌
    if (req.method !== 'GET' && !this.tokens.verify(secret, token)) {
      throw new UnauthorizedException('Invalid CSRF token');
    }

    next();
  }

  private shouldSkip(req: Request): boolean {
    // 跳过 API 路由和令牌端点
    return req.path.startsWith('/api/') || 
           req.path === '/oauth/token' ||
           req.path === '/oauth/revoke';
  }
} 