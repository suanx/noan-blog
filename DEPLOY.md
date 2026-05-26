# EdgeOne Pages 部署指南

## 一、GitHub Secrets 配置（必需）

在 GitHub 仓库中配置以下 Secrets：

**路径**: `Settings → Secrets and variables → Actions → New repository secret`

| Secret 名称 | 说明 | 获取方式 |
|------------|------|----------|
| `EDGEONE_API_TOKEN` | EdgeOne API Token | [EdgeOne 控制台 → API Token](https://edgeone.ai/settings/api-token) |

### 获取 EdgeOne API Token 步骤

1. 登录 [EdgeOne 控制台](https://edgeone.ai/)
2. 进入 **设置 → API Token**
3. 点击 **创建 API Token**
4. 设置名称（如 `GitHub Actions`），权限选择 **Pages 部署**
5. 复制生成的 Token（仅显示一次，请妥善保存）
6. 在 GitHub 仓库中添加为 Secret：`EDGEONE_API_TOKEN`

---

## 二、EdgeOne Pages 环境变量配置（运行时必需）

这些变量**不在 GitHub Secrets 中配置**，而是在 EdgeOne Pages 控制台中配置：

**路径**: EdgeOne 控制台 → 项目 → 项目设置 → 环境变量

### 必需环境变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `TURSO_DATABASE_URL` | Turso 数据库 URL | `libsql://your-db-url.turso.io` |
| `TURSO_AUTH_TOKEN` | Turso 数据库认证 Token | `d1234567890abcdef...` |
| `JWT_SECRET` | JWT 签名密钥 | 32+ 字符随机字符串 |
| `ADMIN_TOKEN` | 管理员 Token | 自定义强密码 |

### 可选环境变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `NEXT_PUBLIC_SITE_URL` | 网站根 URL（用于 ISR 自请求） | `https://your-blog.edgeone.app` |
| `AI_API_KEY` | AI 服务 API 密钥 | `sk-...` |
| `AI_BASE_URL` | AI 服务地址 | `https://api.openai.com/v1` |
| `AI_MODEL` | AI 模型名 | `gpt-3.5-turbo` |
| `WEBHOOK_URLS` | Webhook 通知地址 | `https://a.com,https://b.com` |

### 配置步骤

1. 登录 EdgeOne 控制台
2. 进入你的 Pages 项目
3. 点击 **设置 → 环境变量**
4. 添加上述必需变量
5. 点击 **保存**

---

## 三、数据库迁移（首次部署前）

在 EdgeOne Pages 部署前，确保数据库表结构已创建：

```bash
# 1. 安装 Turso CLI
npm install -g @libsql/cli

# 2. 按顺序执行迁移
turso db shell noan-blog < lib/schema.sql
turso db shell noan-blog < lib/migration.sql
turso db shell noan-blog < lib/migration2.sql
turso db shell noan-blog < lib/migration3.sql
turso db shell noan-blog < lib/migration4.sql
turso db shell noan-blog < lib/migration5.sql

# 3. 同步 FTS5 索引
turso db shell noan-blog "INSERT INTO posts_fts(rowid,title,content,excerpt) SELECT id,title,content,excerpt FROM posts;"
turso db shell noan-blog "INSERT INTO post_translations_fts(rowid,title,content,excerpt) SELECT id,title,content,excerpt FROM post_translations;"

# 4. 导入示例数据（可选）
turso db shell noan-blog < lib/seed.sql
```

---

## 四、本地测试部署

```bash
# 预览部署（不覆盖生产）
npx edgeone pages deploy .next -n noan-blog -t <your_edgeone_token> -e preview

# 生产部署
npx edgeone pages deploy .next -n noan-blog -t <your_edgeone_token> -e production
```

---

## 五、GitHub Actions 工作流说明

### 触发条件

| 事件 | 触发条件 | 部署环境 |
|------|----------|----------|
| Push | 推送到 `main` 分支 | `preview` |
| PR | 创建/更新到 `main` 的 PR | `preview` |
| 手动 | Actions → Run workflow | 可选择 `preview` 或 `production` |

### 工作流文件

`.github/workflows/deploy-edgeone.yml`

### 部署流程

```
Checkout → Setup Node → npm ci → npm run build → Verify → Deploy → Health Check
```

### 查看部署状态

1. GitHub Actions → 选择最近的 workflow run
2. 查看 Build 和 Deploy 步骤日志
3. 部署成功后在 Summary 中获取 Deploy URL

---

## 六、常见问题

### Q: 部署失败，提示 `EDGEONE_API_TOKEN` 无效

**A**: 
1. 确认 Token 在 EdgeOne 控制台中未过期
2. 确认 GitHub Secret 名称完全匹配 `EDGEONE_API_TOKEN`
3. 确认 Token 权限包含 **Pages 部署**

### Q: 部署成功但访问 500 错误

**A**: 
1. 检查 EdgeOne Pages 环境变量是否已配置
2. 检查数据库迁移是否已执行
3. 查看 EdgeOne Pages 日志：控制台 → 项目 → 日志

### Q: 如何更新生产环境？

**A**: 
1. 推送到 `main` 分支会自动部署到 preview
2. 在 GitHub Actions 中手动触发 workflow，选择 `production` 环境
3. 或在 EdgeOne 控制台中从 preview 提升到 production

---

## 七、安全建议

- ✅ 不在代码中硬编码任何密钥
- ✅ 使用 GitHub Secrets 管理 API Token
- ✅ 使用 EdgeOne 环境变量管理运行时配置
- ✅ 定期轮换 `JWT_SECRET` 和 `ADMIN_TOKEN`
- ✅ 生产环境使用强密码（16+ 字符）
