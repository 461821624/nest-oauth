# NestJS OAuth2.0 服务器

这是一个基于 NestJS 实现的完整的 OAuth2.0 授权服务器，支持多种授权模式。

## 功能特性

- 支持多种 OAuth2.0 授权模式：
  - 授权码模式 (Authorization Code)
  - 密码模式 (Password)
- 完整的用户认证系统
- 客户端应用管理
- 用户授权管理
- 访问令牌和刷新令牌管理
- 基于 TypeORM 的数据持久化
- 使用 EJS 模板引擎的用户界面

## 技术栈

- NestJS - 后端框架
- TypeORM - 数据库 ORM
- MySQL - 数据库
- EJS - 模板引擎
- Express - HTTP 服务器
- bcrypt - 密码加密
- express-session - 会话管理

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置数据库

1. 确保你有一个运行中的 MySQL 服务器
2. 在 `src/app.module.ts` 中配置数据库连接：

## 运行

### 3. 初始化数据库

```bash
# 创建测试数据
npx ts-node src/cli.ts
```

### 4. 启动服务器

```bash
# 开发模式
npm run start:dev

# 生产模式
npm run build
npm run start:prod
```

### 5. 启动测试客户端

```bash
cd client
npm install
node index.js
```

## 测试账号

服务器初始化后会创建以下测试账号：

- 测试用户：

  - 用户名：testuser
  - 密码：123456
- 测试客户端：

  - 客户端ID：testclient
  - 客户端密钥：testclientsecret
  - 回调地址：http://localhost:3030/callback

## API 端点

### OAuth2.0 端点

- 授权端点：`/oauth2/authorize`
- 令牌端点：`/oauth2/token`
- 令牌验证端点：`/oauth2/verify`

### 用户相关端点

- 用户登录：`/auth/login`
- 用户注册：`/auth/register`

### 客户端管理端点

- 客户端列表：`/client`
- 创建客户端：`/client/create`
- 更新客户端：`/client/:id`
- 删除客户端：`/client/:id`

### 授权管理端点

- 授权列表：`/authorization`
- 撤销授权：`/authorization/:id`

## 授权流程示例

### 授权码模式

1. 启动测试客户端：

```bash
  http://localhost:3030/ # 访问测试客户端，点击授权码模式
```

2. 用户登录并同意授权
3. 获取访问令牌：

```bash
http://localhost:3030/callback?code={code}&state={state}
```

### 密码模式

```bash
curl -X POST http://localhost:3000/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=testclient" \
  -d "client_secret=testclientsecret" \
  -d "username=testuser" \
  -d "password=123456" \
  -d "scope=read write"
```

## 安全性考虑

- 实现了 CSRF 防护
- 密码使用 bcrypt 加密存储
- 实现了 state 参数验证
- 访问令牌有效期管理
- 支持令牌撤销

## 开发说明

### 目录结构

```
├── src/
│   ├── auth/           # 认证相关模块
│   ├── oauth2/         # OAuth2.0 核心模块
│   ├── entities/       # 数据库实体
│   ├── migrations/     # 数据库迁移文件
│   └── views/          # EJS 模板文件
├── client/            # 测试客户端
└── test/             # 测试文件
```

### 添加新的授权类型

1. 在 `src/oauth2/oauth2.service.ts` 中实现新的授权类型处理方法
2. 在 `src/oauth2/oauth2.controller.ts` 中添加相应的路由处理
3. 更新客户端实体的 grants 字段
4. 添加相应的单元测试

### 自定义范围（Scope）

在 `src/oauth2/oauth2.service.ts` 中的 `validateScope` 方法中定义和验证自定义范围。

## 许可证

MIT
