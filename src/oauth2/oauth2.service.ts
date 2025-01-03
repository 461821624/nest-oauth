import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as OAuth2Server from 'oauth2-server';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../entities/user.entity';
import { Client } from '../entities/client.entity';
import { AuthCode } from '../entities/auth-code.entity';
import { AccessToken } from '../entities/access-token.entity';
import { RefreshToken } from '../entities/refresh-token.entity';

@Injectable()
export class OAuth2Service {
  private oauth: OAuth2Server;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(AuthCode)
    private readonly authCodeRepository: Repository<AuthCode>,
    @InjectRepository(AccessToken)
    private readonly accessTokenRepository: Repository<AccessToken>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>
  ) {
    this.oauth = new OAuth2Server({
      model: {
        getAccessToken: this.getAccessToken.bind(this),
        getClient: this.getClient.bind(this),
        getRefreshToken: this.getRefreshToken.bind(this),
        saveToken: this.saveToken.bind(this),
        revokeToken: this.revokeToken.bind(this),
        validateScope: this.validateScope.bind(this),
        verifyScope: this.verifyScope.bind(this),
        getUser: this.getUser.bind(this),
        generateAccessToken: this.generateAccessToken.bind(this),
        generateRefreshToken: this.generateRefreshToken.bind(this),
        generateAuthorizationCode: this.generateAuthorizationCode.bind(this),
        getAuthorizationCode: this.getAuthorizationCode.bind(this),
        saveAuthorizationCode: this.saveAuthorizationCode.bind(this),
        revokeAuthorizationCode: this.revokeAuthorizationCode.bind(this),
      },
      accessTokenLifetime: 3600,
      refreshTokenLifetime: 2592000,
      allowBearerTokensInQueryString: true,
    });
  }

  get server() {
    return this.oauth;
  }

  async getAccessToken(accessToken: string) {
    const token = await this.accessTokenRepository.findOne({
      where: { token: accessToken },
      relations: ['user', 'client']
    });
    if (!token) return null;
    return {
      accessToken: token.token,
      accessTokenExpiresAt: token.expiresAt,
      scope: token.scope,
      client: token.client,
      user: token.user
    };
  }

  async getClient(clientId: string, clientSecret: string) {
    const client = await this.clientRepository.findOne({
      where: { 
        clientId,
        ...(clientSecret && { clientSecret })
      }
    });
    
    if (!client) return null;
    return client;
  }

  async getRefreshToken(refreshToken: string) {
    const token = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken },
      relations: ['user', 'client']
    });
    if (!token) return null;
    return {
      refreshToken: token.token,
      refreshTokenExpiresAt: token.expiresAt,
      scope: token.scope,
      client: token.client,
      user: token.user
    };
  }

  async getAuthorizationCode(authorizationCode: string) {
    const code = await this.authCodeRepository.findOne({
      where: { code: authorizationCode },
      relations: ['user', 'client']
    });

    if (!code) return null;
    return {
      code: code.code,
      expiresAt: code.expiresAt,
      redirectUri: code.redirectUri,
      scope: code.scope,
      client: code.client,
      user: code.user
    };
  }

  async saveAuthorizationCode(code: any, client: any, user: any) {
    const authCode = await this.authCodeRepository.save({
      code: code.authorizationCode,
      expiresAt: code.expiresAt,
      redirectUri: code.redirectUri,
      scope: Array.isArray(code.scope) ? code.scope : code.scope.split(' '),
      client: { id: client.id },
      user: { id: user.id }
    });

    return {
      code: authCode.code,
      expiresAt: authCode.expiresAt,
      redirectUri: authCode.redirectUri,
      scope: authCode.scope,
      client,
      user
    };
  }

  async revokeAuthorizationCode(code: any) {
    const result = await this.authCodeRepository.delete({ code: code.code });
    return result.affected > 0;
  }

  async saveToken(token: any, client: any, user: any) {
    const accessToken = await this.accessTokenRepository.save({
      token: token.accessToken,
      expiresAt: token.accessTokenExpiresAt,
      scope: Array.isArray(token.scope) ? token.scope : token.scope.split(' '),
      client: { id: client.id },
      user: { id: user.id }
    });

    let refreshToken;
    if (token.refreshToken) {
      refreshToken = await this.refreshTokenRepository.save({
        token: token.refreshToken,
        expiresAt: token.refreshTokenExpiresAt,
        scope: Array.isArray(token.scope) ? token.scope : token.scope.split(' '),
        client: { id: client.id },
        user: { id: user.id }
      });
    }

    return {
      accessToken: accessToken.token,
      accessTokenExpiresAt: accessToken.expiresAt,
      refreshToken: refreshToken?.token,
      refreshTokenExpiresAt: refreshToken?.expiresAt,
      scope: accessToken.scope,
      client,
      user
    };
  }

  async revokeToken(token: any) {
    const result = await this.refreshTokenRepository.delete({ token: token.refreshToken });
    return result.affected > 0;
  }

  async validateScope(user: any, client: any, scope: string | string[]) {
    if (!scope) return false;

    try {
      const clientInfo = await this.clientRepository.findOne({
        where: { clientId: client.clientId || client.id }
      });

      if (!clientInfo?.scope?.length) return false;

      const requestedScopes = Array.isArray(scope) ? scope : scope.split(' ');
      console.log('Requested scopes:', requestedScopes);
      console.log('Client scopes:', clientInfo.scope);
      
      const isValid = requestedScopes.every(s => clientInfo.scope.includes(s));
      return isValid ? requestedScopes.join(' ') : false;
    } catch (error) {
      console.error('Scope validation error:', error);
      return false;
    }
  }

  async verifyScope(token: any, scope: string | string[]) {
    if (!token.scope || !scope) return false;
    const tokenScopes = Array.isArray(token.scope) ? token.scope : token.scope.split(' ');
    const requestedScopes = Array.isArray(scope) ? scope : scope.split(' ');
    return requestedScopes.every(s => tokenScopes.includes(s));
  }

  async getUser(username: string, password: string) {
    const user = await this.userRepository.findOne({
      where: { username }
    });
    if (!user) return false;
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : false;
  }

  async generateAccessToken(client: any, user: any, scope: string) {
    return crypto.randomBytes(32).toString('hex');
  }

  async generateRefreshToken(client: any, user: any, scope: string) {
    return crypto.randomBytes(32).toString('hex');
  }

  async generateAuthorizationCode(client: any, user: any, scope: string) {
    return crypto.randomBytes(16).toString('hex');
  }
} 