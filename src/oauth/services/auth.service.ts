import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  // 查找用户
  async findUserByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  // 验证客户端
  async validateClient(clientId: string, clientSecret?: string): Promise<any> {
    const client = await this.prisma.client.findFirst({
      where: { clientId },
    });

    if (!client) {
      throw new UnauthorizedException('Invalid client credentials');
    }

    // 如果提供了 clientSecret，则验证它
    if (clientSecret && client.clientSecret !== clientSecret) {
      throw new UnauthorizedException('Invalid client credentials');
    }

    return client;
  }

  // 验证密码
  async validatePassword(username: string, password: string): Promise<any> {
    console.log('Validating password for user:', username);
    
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        email: true,
        password: true,
      },
    });

    if (!user) {
      console.log('User not found:', username);
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log('Found user:', { id: user.id, username: user.username });
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password validation:', { 
      isValid: isPasswordValid,
      username: user.username
    });

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 不返回密码
    const { password: _, ...result } = user;
    return result;
  }

  // 生成访问令牌
  async generateAccessToken(payload: any): Promise<string> {
    // 验证客户端
    const client = await this.prisma.client.findFirst({
      where: { clientId: payload.clientId }
    });

    if (!client) {
      throw new UnauthorizedException('Invalid client');
    }

    // 如果有用户ID（非客户端模式），则验证用户
    if (payload.sub && payload.sub !== payload.clientId) {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub }
      });

      if (!user) {
        throw new UnauthorizedException('Invalid user');
      }
    }

    const token = this.jwtService.sign(payload);
    await this.prisma.accessToken.create({
      data: {
        token,
        userId: payload.sub === payload.clientId ? client.userId : payload.sub,
        clientId: client.id,
        scope: payload.scope,
        expiresAt: new Date(Date.now() + this.configService.get('oauth.tokenExpiresIn') * 1000),
      },
    });
    return token;
  }

  // 生成授权码
  async generateAuthorizationCode(userId: string, clientId: string, scope?: string): Promise<string> {
    // 验证用户和客户端是否存在
    const [user, client] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.client.findFirst({ where: { clientId } })
    ]);

    if (!user || !client) {
      throw new UnauthorizedException('Invalid user or client');
    }

    const code = uuidv4();
    await this.prisma.authCode.create({
      data: {
        code,
        userId: user.id,
        clientId: client.id,
        scope,
        expiresAt: new Date(Date.now() + this.configService.get('oauth.authCodeExpiresIn') * 1000),
      },
    });
    return code;
  }

  // 验证授权码
  async validateAuthorizationCode(code: string, clientId: string): Promise<any> {
    // 先获取客户端
    const client = await this.prisma.client.findFirst({
      where: { clientId }
    });

    if (!client) {
      throw new UnauthorizedException('Invalid client');
    }

    const authCode = await this.prisma.authCode.findFirst({
      where: {
        code,
        clientId: client.id,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    if (!authCode) {
      throw new UnauthorizedException('Invalid authorization code');
    }

    // 使用后立即删除授权码
    await this.prisma.authCode.delete({
      where: { id: authCode.id },
    });

    return authCode;
  }

  // 生成刷新令牌
  async generateRefreshToken(userId: string, clientId: string): Promise<string> {
    // 验证用户和客户端是否存在
    const [user, client] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.client.findFirst({ where: { clientId } })
    ]);

    if (!user || !client) {
      throw new UnauthorizedException('Invalid user or client');
    }

    const token = uuidv4();
    await this.prisma.refreshToken.create({
      data: {
        token,
        userId: user.id,
        clientId: client.id,
        expiresAt: new Date(Date.now() + this.configService.get('oauth.refreshTokenExpiresIn') * 1000),
      },
    });
    return token;
  }

  // 验证刷新令牌
  async validateRefreshToken(token: string, clientId: string): Promise<any> {
    // 先获取客户端
    const client = await this.prisma.client.findFirst({
      where: { clientId }
    });

    if (!client) {
      throw new UnauthorizedException('Invalid client');
    }

    const refreshToken = await this.prisma.refreshToken.findFirst({
      where: {
        token,
        clientId: client.id,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return refreshToken;
  }

  // 撤销令牌
  async revokeToken(token: string, clientId: string, tokenTypeHint?: string): Promise<void> {
    // 验证客户端
    const client = await this.prisma.client.findFirst({
      where: { clientId }
    });

    if (!client) {
      throw new UnauthorizedException('Invalid client');
    }

    // 根据令牌类型提示查找并删除令牌
    if (tokenTypeHint === 'refresh_token') {
      await this.prisma.refreshToken.deleteMany({
        where: {
          token,
          clientId: client.id
        }
      });
    } else {
      // 默认尝试删除访问令牌
      await this.prisma.accessToken.deleteMany({
        where: {
          token,
          clientId: client.id
        }
      });
    }
  }

  // 获取令牌信息
  async getTokenInfo(token: string): Promise<any> {
    // 先查找访问令牌
    const accessToken = await this.prisma.accessToken.findFirst({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        client: true
      }
    });

    if (accessToken) {
      return {
        active: new Date() < accessToken.expiresAt,
        scope: accessToken.scope,
        client_id: accessToken.client.clientId,
        username: accessToken.user.username,
        exp: Math.floor(accessToken.expiresAt.getTime() / 1000),
        token_type: 'access_token'
      };
    }

    // 如果不是访问令牌，查找刷新令牌
    const refreshToken = await this.prisma.refreshToken.findFirst({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        client: true
      }
    });

    if (refreshToken) {
      return {
        active: new Date() < refreshToken.expiresAt,
        client_id: refreshToken.client.clientId,
        username: refreshToken.user.username,
        exp: Math.floor(refreshToken.expiresAt.getTime() / 1000),
        token_type: 'refresh_token'
      };
    }

    // 如果都没找到，返回令牌无效
    return {
      active: false
    };
  }
} 