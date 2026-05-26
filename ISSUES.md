# Noan Blog — 已知问题与待修复清单

## 🔴 严重问题

### 1. `request.json()` 在 EdgeOne Pages 运行时不兼容
- **影响**: 所有 POST API 路由（login, register, comments, AI, posts CRUD）
- **原因**: EdgeOne Pages 的 OpenNext 云函数中 `Request.json()` 方法解析 JSON 失败（可能因为运行时实现差异）
- **临时修复**: 已改用 `request.text()` + `JSON.parse()` 替代
- **需要**: 确认 EdgeOne Pages 云函数 Node.js 版本的 Request API 兼容性，或选择兼容的部署方式

### 2. `@libsql/client` 在自动构建中被剔除
- **影响**: `lib/db.js` 无法导入 `@libsql/client` 或 `@tursodatabase/serverless`
- **原因**: OpenNext 构建插件打包云函数时，没有将 `@libsql/client` 及其依赖完整复制到 `.edgeone/cloud-functions/ssr-node/node_modules/`
- **临时修复**: `lib/db.js` 改用 Turso REST API（`/v2/pipeline`）直接通过 `fetch` 访问数据库，不需要外部包
- **需要**: 修复 OpenNext 构建配置，确保 `@libsql/client` 被正确包含，或长期使用 REST API 方式

### 3. EdgeOne Pages `global` 区域无法绑定自定义域名
- **影响**: 无法使用 `noan.suanx.eu.cc` 等自定义域名
- **原因**: 首次部署时用了 `global`（含中国大陆）区域，该区域需要备案才能绑定自定义域名
- **修复**: 已重建项目，使用 `-a overseas`（全球不含中国大陆）区域部署
- **状态**: ✅ 已解决

### 4. GitHub Actions 无法触发工作流
- **影响**: 无法自动化 CI/CD 部署
- **原因**: 用户 GitHub 账号被暂停（"Your account is suspended"）
- **需要**: 联系 GitHub Support 解封账号

## 🟡 待优化

### 5. 数据库 Row 格式兼容
- `lib/db.js` 的 `normalizeResult()` 将 Turso API 返回的 `{type, value}` 格式转换为对象格式
- 需要确保所有路由都正确使用了 `result.rows` 的对象格式

### 6. 密码哈希 - `crypto.subtle` 兼容性
- `lib/crypto.js` 使用 Web Crypto API（`crypto.subtle`）
- 在 EdgeOne Pages 云函数中可能不可用（Node.js 22 理论上支持，需部署验证）
- 备选: 使用 `bcryptjs` 的纯 JS 实现（不依赖 native 模块）

### 7. 静态页面生成时数据库不可用
- `generateStaticParams` 在构建时需要查询 `posts` 表获取 slug 列表
- 构建环境没有 `TURSO_DATABASE_URL` 时返回空数组
- 已用 `try/catch` 处理，不影响构建

### 8. 多语言 FTS5 搜索的 `content` 字段类型
- `post_translations_fts` 的 `content` 列定义用了 `TEXT`，但 FTS5 要求 `content=` 指向源表
- 当前 `migration2.sql` 中 `post_translations_fts` 使用了 `content='post_translations'`，但 `post_translations.content` 是 TEXT，FTS5 需要内容列
- 需要验证搜索功能是否正常工作

## 🟢 已修复

| 问题 | 修复 |
|------|------|
| EdgeOn Runtime 不支持 jsonwebtoken | 改用 `jose` |
| Edge Runtime 不支持 bcryptjs | 改用 Web Crypto API PBKDF2 |
| author_id 硬编码为 1 | 改用 `requireAdmin` 获取当前用户 |
| 无输入验证 | 添加 Zod 验证 |
| 无 ISR 缓存失效 | 添加 `revalidatePath` |
| 搜索无频率限制 | 添加 `search_logs` 表限流 |
| 搜索只搜原文不搜翻译 | 添加 `post_translations_fts` 双表搜索 |
| 管理后台英文 | 全部改为中文 |
| 前端风格简陋 | 参考 laogou717.com 重新设计 |
| Admin 后台风格 | 参考 Strapi 管理面板重新设计 |
| API 错误消息英文 | 全部翻译为中文 |
| `@libsql/client` 依赖问题 | 改用 Turso REST API |
| `request.json()` 不兼容 | 改用 `request.text()` + `JSON.parse()` |
| 部署区域错误 | 重建项目使用 `overseas` 区域 |
