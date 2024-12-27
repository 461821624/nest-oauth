export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-key-here',
    expiresIn: '1h',
  },
  oauth: {
    tokenExpiresIn: 3600, // 访问令牌过期时间（秒）
    refreshTokenExpiresIn: 30 * 24 * 3600, // 刷新令牌过期时间（秒）
    authCodeExpiresIn: 600, // 授权码过期时间（秒）
  },
  cors: {
    enabled: true,
    origin: process.env.CORS_ORIGIN || '*',
  },
  swagger: {
    enabled: process.env.SWAGGER_ENABLED !== 'false',
    title: 'NestJS OAuth 2.0 API',
    description: 'OAuth 2.0 授权服务器 API 文档',
    version: '1.0',
    path: 'api',
  },
}); 