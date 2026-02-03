# 言の葉の記録 (Kotoba Diary) - Cloudflare Workers 版本

## 项目结构

```
kotoba-diary/
├── src/                      # Workers 源代码
│   ├── index.js             # 主入口文件 (路由处理)
│   └── api/
│       ├── login.js         # 登录 API
│       ├── data.js          # 数据 CRUD API
│       └── upload.js        # 文件上传 API
├── public/                   # 静态前端文件
│   ├── index.html           # 前端页面
│   └── assets/              # 图片、字体等
├── wrangler.toml            # Cloudflare Workers 配置
├── package.json             # 项目依赖
├── .gitignore
└── README.md                # 本文件
```

## 部署步骤

### 1. 安装依赖
\`\`\`bash
npm install
# 或
yarn install
\`\`\`

### 2. 配置 Cloudflare
编辑 \`wrangler.toml\`，填入你的 Cloudflare 账户信息：

- \`account_id\`: 你的 Cloudflare 账户 ID
- \`zone_id\`: 你的域名对应的 Zone ID
- \`DIARY_KV\`: KV 命名空间 ID

### 3. 创建 KV 命名空间
\`\`\`bash
wrangler kv:namespace create "DIARY_KV"
wrangler kv:namespace create "DIARY_KV" --preview
\`\`\`

### 4. 设置环境变量
创建 \`.env.local\` 文件：
\`\`\`
DIARY_PASSWORD=你的日记密码
\`\`\`

### 5. 本地开发
\`\`\`bash
npm run dev
\`\`\`

### 6. 部署到 Cloudflare
\`\`\`bash
npm run deploy
\`\`\`

## API 端点

### POST /api/login
验证密码并获取 Token
\`\`\`json
Request: { "password": "你的密码" }
Response: { "token": "xxx.yyy" }
\`\`\`

### GET /api/data
获取所有日记数据 (公开)
\`\`\`json
Response: { "entries": [...], "checkins": [...] }
\`\`\`

### POST /api/data
保存日记数据 (需要 Token)
\`\`\`
Authorization: Bearer {token}
Request: { "entries": [...], "checkins": [...] }
\`\`\`

### PUT /api/upload
上传图片 (需要 Token)
\`\`\`
Authorization: Bearer {token}
Content-Type: multipart/form-data
\`\`\`

### GET /api/upload?id={imageId}
获取图片数据

## 功能特性

✅ 云函数架构  
✅ 数据加密存储 (KV)  
✅ 密码认证 + Token 验证  
✅ 图片上传到 KV  
✅ CORS 支持  
✅ 零冷启动 (Cloudflare Edge)

## 故障排查

### KV 配置错误
确保 \`wrangler.toml\` 中的 \`account_id\` 和 \`kv_namespaces\` 正确配置

### 密码验证失败
检查 \`.env.local\` 中的 \`DIARY_PASSWORD\` 是否正确

### CORS 错误
确保前端请求带上正确的 \`Authorization\` header

---
**作者**: Kotoba Diary Team  
**最后更新**: 2026-02-03
