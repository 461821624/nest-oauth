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

- 用户认证和授权
- JWT Token 支持
- 数据持久化（PostgreSQL）
- 美观的用户界面

## 技术栈

- NestJS - 后端框架
- PostgreSQL - 数据库
- Prisma - ORM
- EJS - 模板引擎
- JWT - 令牌生成和验证
- TypeScript - 开发语言

## 项目设置

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
创建 `.env` 文件并添加以下配置：
```env
DATABASE_URL="postgresql://postgres:123456@localhost:5432/nest_oauth?schema=public"
JWT_SECRET="your-super-secret-key-here"
```

4. 初始化数据库
```bash
npx prisma generate
npx prisma db push
```

## 运行项目

1. 开发模式
```bash
pnpm run start:dev
```

2. 生产模式
```bash
pnpm run build
pnpm run start:prod
```

## API 端点

### OAuth 2.0 端点

- `GET /oauth/authorize` - 授权端点
- `POST /oauth/token` - 令牌端点
- `POST /oauth/login` - 用户登录
- `POST /oauth/authorize/decision` - 用户授权决定

### 应用管理端点

- `GET /oauth/clients` - 获取应用列表
- `GET /oauth/clients/new` - 创建新应用页面
- `POST /oauth/clients` - 创建新应用
- `GET /oauth/clients/:id` - 获取应用详情
- `DELETE /oauth/clients/:id` - 删除应用

### 用户管理端点

- `POST /users` - 创建用户
- `GET /users/:id` - 获取用户信息
- `GET /users` - 获取用户列表

## 测试流程

1. 初始化测试用户
```
GET http://localhost:3000/oauth/init
```

2. 创建 OAuth 客户端应用
```
GET http://localhost:3000/oauth/clients/new
```

3. 测试授权流程
```
GET http://localhost:3001
```

## 目录结构

```
nest-oauth/
├── src/
│   ├── auth/           # 认证相关模块
│   ├── oauth/          # OAuth 相关模块
│   ├── users/          # 用户相关模块
│   ├── prisma/         # Prisma 配置
│   └── views/          # EJS 模板
├── prisma/
│   └── schema.prisma   # 数据库模型
└── client/             # 测试客户端
```

## 安全性考虑

- 使用 bcrypt 加密用户密码
- JWT 令牌加密
- HTTPS 支持（生产环境）
- CSRF 保护
- XSS 防护


## 许可证

MIT
