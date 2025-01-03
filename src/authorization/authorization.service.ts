import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccessToken } from '../entities/access-token.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { AuthCode } from '../entities/auth-code.entity';

@Injectable()
export class AuthorizationService {
  constructor(
    @InjectRepository(AccessToken)
    private readonly accessTokenRepository: Repository<AccessToken>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(AuthCode)
    private readonly authCodeRepository: Repository<AuthCode>
  ) {}

  async findAllByUser(userId: number) {
    // 获取用户所有的访问令牌，并按客户端分组
    const tokens = await this.accessTokenRepository.find({
      where: { user: { id: userId } },
      relations: ['client'],
      order: { createdAt: 'DESC' }
    });

    // 按客户端分组并整理数据
    const authorizations = new Map();
    tokens.forEach(token => {
      if (!authorizations.has(token.client.id)) {
        authorizations.set(token.client.id, {
          client: {
            id: token.client.id,
            name: token.client.name,
            clientId: token.client.clientId
          },
          scope: token.scope,
          createdAt: token.createdAt,
          lastUsed: token.createdAt
        });
      }
    });

    return Array.from(authorizations.values());
  }

  async revokeAccess(userId: number, clientId: string) {
    // 删除访问令牌
    await this.accessTokenRepository.delete({
      user: { id: userId },
      client: { clientId }
    });

    // 删除刷新令牌
    await this.refreshTokenRepository.delete({
      user: { id: userId },
      client: { clientId }
    });

    // 删除授权码
    await this.authCodeRepository.delete({
      user: { id: userId },
      client: { clientId }
    });

    return { success: true };
  }
} 