# NestJS OAuth 2.0 服务器

这是一个基于 NestJS 框架实现的完整的 OAuth 2.0 授权服务器。

## 功能特性

- 支持多种 OAuth 2.0 授权模式：
  - 授权码模式 (Authorization Code)
  - 简化模式 (Implicit)
  - 密码模式 (Password)
  - 客户端模式 (Client Credentials)
  - 刷新令牌 (Refresh Token)

- 完整的应用管理功能：
  - 创建新的 OAuth 客户端应用
  - 查看应用列表
  - 查看应用详情
  - 删除应用

- 高级安全特性：
  - 速率限制（Rate Limiting）：
    - 基于 IP 地址的请求限制
    - 默认每个 IP 每分钟最多 10 个请求
    - 可配置的限制时间和请求次数
  - 安全头配置（Helmet）：
    - 开发环境：禁用 CSP 以方便调试
    - 生产环境：完整的安全头配置
    - 跨站脚本保护（XSS）
    - 点击劫持保护
  - CORS 配置：
    - 允许指定源访问（默认 localhost:3001）
    - 支持凭证请求
  - 会话管理：
    - 安全的会话配置
    - 24小时会话过期
    - HttpOnly cookie
  - 输入验证：
    - 全局验证管道
    - 数据转换和清理
    - 白名单验证

- 开发者友好：
  - Swagger API 文档
  - 美观的用户界面
  - TypeScript 支持
  - 热重载开发
  - 详细的错误处理

## 环境要求

- Node.js >= 16
- PostgreSQL >= 12
- pnpm >= 8

## 快速开始

1. 克隆项目
```bash
git clone https://github.com/461821624/nest-oauth.git
cd nest-oauth
```

2. 安装依赖
```bash
pnpm install
```

3. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件配置数据库等信息
```

4. 初始化数据库
```bash
pnpm prisma generate
pnpm prisma db push
http://localhost:3001/oauth/init #初始化测试数据
```

5. 启动开发服务器
```bash
pnpm start:dev
```

## 环境变量配置

```env
# 基础配置
PORT=3000
NODE_ENV=development

# 数据库配置
DATABASE_URL="postgresql://postgres:123456@localhost:5432/nest_oauth?schema=public"

# JWT配置
JWT_SECRET="your-super-secret-key-here"

# CORS配置
CORS_ORIGIN="http://localhost:3001"

# 会话配置
SESSION_SECRET="your-session-secret"

# OAuth配置
OAUTH_TOKEN_EXPIRES_IN=3600
OAUTH_REFRESH_TOKEN_EXPIRES_IN=2592000
OAUTH_AUTH_CODE_EXPIRES_IN=600
```

## 安全配置说明

### 开发环境

在开发环境中，某些安全特性被适当放宽以方便开发：

```typescript
// main.ts
app.use(helmet({
  contentSecurityPolicy: false,  // 禁用 CSP
  crossOriginEmbedderPolicy: false
}));
```

### 生产环境

生产环境应启用完整的安全特性：

1. 修改 main.ts 中的 Helmet 配置
2. 启用 HTTPS
3. 设置严格的 CORS 策略
4. 配置安全的会话选项

## API 文档

启动服务器后访问：
```
http://localhost:3000/api
```

## 测试

1. 单元测试
```bash
pnpm test
```

2. E2E 测试
```bash
pnpm test:e2e
```

## 部署

1. 构建生产版本
```bash
pnpm build
```

2. 启动生产服务器
```bash
pnpm start:prod
```


## 许可证

MIT
