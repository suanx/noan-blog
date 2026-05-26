# Noan Blog

基于 Next.js（App Router）+ TailwindCSS v4 + Turso（libSQL）+ EdgeOne Pages 构建的多语言博客系统。

## 技术栈

| 层        | 技术                                                    |
| --------- | ------------------------------------------------------- |
| 框架      | Next.js 16（App Router）                                |
| 样式      | TailwindCSS v4 + `@tailwindcss/typography`              |
| 数据库    | Turso（libSQL），HTTP 客户端 `@libsql/client/web`       |
| 认证      | JWT（jsonwebtoken）+ bcryptjs + Admin-Token 双通道      |
| 全文搜索  | SQLite FTS5（posts_fts 虚拟表）                         |
| 多语言    | proxy.ts 中间件，路径前缀 `/zh/`、`/en/`                |
| AI 辅助   | OpenAI 兼容 API（支持 DeepSeek、通义千问等）            |
| 部署      | EdgeOne Pages + GitHub Actions                          |

## 功能

- 文章管理：创建、编辑、删除、发布/草稿
- 多语言支持：英文 / 中文，独立 slug 和翻译内容
- 分类与标签：文章分类和标签管理
- 评论系统：访客评论 + 管理员审核 + IP 频率限制
- 全文搜索：FTS5 高亮搜索结果
- 阅读计数：文章浏览量统计
- SEO 元数据：自定义 SEO 标题和描述
- AI 辅助：一键生成摘要、标签推荐、SEO 优化
- Webhook：文章创建/更新时自动通知
- 响应式设计：明暗模式自适应

## 环境变量

在 EdgeOne Pages 控制台或 `.env.local` 中配置：

| 变量名                  | 必填 | 说明                              |
| ----------------------- | ---- | --------------------------------- |
| `TURSO_DATABASE_URL`    | 是   | Turso 数据库 URL                  |
| `TURSO_AUTH_TOKEN`      | 是   | Turso 数据库认证 Token            |
| `JWT_SECRET`            | 是   | JWT 签名密钥                      |
| `ADMIN_TOKEN`           | 否   | 传统 Admin-Token 鉴权的备选密钥   |
| `NEXT_PUBLIC_SITE_URL`  | 否   | 站点 URL，ISR 自请求时需要         |
| `WEBHOOK_URLS`          | 否   | Webhook 地址，多个用逗号分隔       |
| `AI_API_KEY`            | 否   | AI 服务 API 密钥                  |
| `AI_BASE_URL`           | 否   | AI 服务地址，默认 `https://api.openai.com/v1` |
| `AI_MODEL`              | 否   | AI 模型名，默认 `gpt-3.5-turbo`    |

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 代码检查
npm run lint
```

## 数据库迁移

按顺序执行迁移脚本：

```bash
turso db shell <数据库名> < lib/schema.sql
turso db shell <数据库名> < lib/migration.sql
turso db shell <数据库名> < lib/migration2.sql
turso db shell <数据库名> < lib/migration3.sql
turso db shell <数据库名> < lib/migration4.sql

# 初始化 FTS5 索引
turso db shell <数据库名> "INSERT INTO posts_fts(rowid,title,content,excerpt) SELECT id,title,content,excerpt FROM posts;"

# 可选：导入示例数据
turso db shell <数据库名> < lib/seed.sql
```

## 项目结构

```
├── app/
│   ├── api/                    # API 路由
│   │   ├── ai/                 # AI 辅助（摘要/标签/SEO）
│   │   ├── auth/               # 认证（注册/登录/当前用户）
│   │   ├── posts/              # 文章 CRUD
│   │   ├── comments/           # 评论提交
│   │   ├── search/             # 全文搜索
│   │   ├── views/              # 阅读计数
│   │   ├── categories/         # 分类列表
│   │   └── tags/               # 标签列表
│   ├── admin/dashboard/        # 管理后台
│   ├── login/                  # 登录页
│   ├── register/               # 注册页
│   ├── posts/[slug]/           # 文章详情
│   ├── search/                 # 搜索结果
│   ├── _components/            # 共享组件
│   ├── layout.tsx              # 根布局
│   ├── page.js                 # 首页
│   └── globals.css             # 全局样式
├── lib/
│   ├── db.js                   # 数据库客户端（@libsql/client/web）
│   ├── db-lite.js              # 数据库备选客户端（@tursodatabase/serverless）
│   ├── auth.js                 # JWT 签名/验证 + requireAdmin
│   ├── webhook.js              # Webhook 异步通知
│   ├── i18n.js                 # 语言检测工具
│   ├── ai-client.js            # AI API 调用封装
│   ├── schema.sql              # 基础表结构
│   ├── migration.sql           # 分类/标签表
│   ├── migration2.sql          # FTS5 + 评论 + 阅读计数
│   ├── migration3.sql          # 文章翻译表
│   ├── migration4.sql          # SEO 字段
│   └── seed.sql                # 示例数据
├── proxy.ts                    # i18n 中间件（替代 middleware.ts）
├── next.config.ts              # Next.js 配置
├── edgeone.json                # EdgeOne Pages 部署配置
└── eslint.config.mjs           # ESLint 配置
```

## API 文档

### 认证

| 方法   | 路径                    | 说明     | 鉴权     |
| ------ | ----------------------- | -------- | -------- |
| POST   | `/api/auth/register`    | 用户注册 | 无       |
| POST   | `/api/auth/login`       | 用户登录 | 无       |
| GET    | `/api/auth/me`          | 当前用户 | Bearer   |

### 文章

| 方法   | 路径                    | 说明         | 鉴权       |
| ------ | ----------------------- | ------------ | ---------- |
| GET    | `/api/posts`            | 文章列表     | 无（admin 参数需鉴权） |
| GET    | `/api/posts/[slug]`     | 文章详情     | 无         |
| POST   | `/api/posts`            | 创建文章     | Admin      |
| PUT    | `/api/posts/[slug]`     | 更新文章     | Admin      |
| DELETE | `/api/posts/[slug]`     | 删除文章     | Admin      |

### AI 辅助

| 方法   | 路径                    | 说明         | 鉴权       |
| ------ | ----------------------- | ------------ | ---------- |
| POST   | `/api/ai/summary`       | 生成摘要     | Admin      |
| POST   | `/api/ai/tags`          | 生成标签     | Admin      |
| POST   | `/api/ai/seo`           | 生成 SEO     | Admin      |

### 交互

| 方法   | 路径                              | 说明           | 鉴权 |
| ------ | --------------------------------- | -------------- | ---- |
| GET    | `/api/posts/[slug]/comments`      | 获取评论       | 无   |
| POST   | `/api/comments`                   | 提交评论       | 无   |
| POST   | `/api/views/[slug]`               | 增加阅读计数   | 无   |
| GET    | `/api/search?q=xxx`               | 全文搜索       | 无   |

## 部署

### EdgeOne Pages

```bash
# 安装 EdgeOne CLI
npm install -g edgeone-cli

# 登录
edgeone login

# 预览部署
edgeone pages deploy

# 生产部署
edgeone pages deploy --prod
```

### GitHub Actions

`.github/workflows/deploy-edgeone.yml` 已配置自动部署，提交到 `main` 分支即可触发。

## 许可证

MIT
