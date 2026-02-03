# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

wechat-article-exporter 是一款微信公众号文章批量下载工具，支持导出多种格式（HTML/JSON/Excel/TXT/MD/DOCX），并可抓取阅读量、评论等数据。

**技术栈**: Nuxt 3 + Vue 3 + TypeScript + Dexie (IndexedDB)

**Node 版本要求**: >= 22

## 目录结构

```
wechat-article-exporter/
├── apis/                    # API 接口层
├── assets/                  # 静态资源文件
├── components/              # Vue 组件
├── composables/             # Vue Composables (组合式函数)
├── config/                  # 配置文件
├── pages/                   # 页面路由
├── public/                  # 公共静态文件
├── samples/                 # 示例数据文件
├── server/                  # Nuxt 服务端代码
├── shared/                  # 前后端共享代码
├── store/                   # 数据存储层
├── test/                    # 测试文件
├── types/                   # TypeScript 类型定义
└── utils/                   # 工具函数
```

### apis/
客户端 API 接口封装层，包含与微信公众号平台交互的所有接口函数。
- `index.ts`: 核心 API 函数，包括 `getArticleList()`、`getAccountList()`、`getComment()` 等

### assets/
静态资源文件目录，存放项目使用的图片等资源。
- `logo.svg`: 项目 Logo
- `deleted.png`: 已删除文章占位图
- `qq-group.png`: QQ 群二维码
- `wechat-support.png`: 微信赞赏码

### components/
Vue 组件目录，按功能模块组织：
- `api/`: API 调试相关组件（DebugModal、Document、Summary 等）
- `base/`: 基础 UI 组件
- `dashboard/`: 仪表盘页面组件
- `global/`: 全局组件
- `grid/`: AG-Grid 表格相关组件（单元格渲染器、状态栏等）
- `modal/`: 弹窗组件
- `preview/`: 文章预览组件
- `search/`: 搜索相关组件
- `selector/`: 选择器组件
- `setting/`: 设置页面组件

### composables/
Vue 3 组合式函数，封装可复用的业务逻辑：
- `useDownloader.ts`: 下载器逻辑封装
- `useExporter.ts`: 导出器逻辑封装
- `useBatchDownload.ts`: 批量下载管理
- `useLoginAccount.ts`: 登录账号状态
- `useLoginCheck.ts`: 登录状态检查
- `usePreferences.ts`: 用户偏好设置
- `useSyncDeadline.ts`: 同步截止时间管理
- `useAccountEventBus.ts`: 账号事件总线
- `toast.ts`: Toast 提示封装

### config/
项目配置文件：
- `index.ts`: 主配置文件
- `proxy.txt`: 代理服务器列表
- `public-apis.ts`: 公开 API 配置
- `public-proxy.ts`: 公开代理配置
- `shared-grid-options.ts`: AG-Grid 共享配置

### pages/
Nuxt 页面路由目录：
- `index.vue`: 首页（登录页）
- `dashboard.vue`: 仪表盘布局页
- `dashboard/`: 仪表盘子页面
  - 文章列表、公众号管理、设置等页面
- `dev/`: 开发调试页面

### public/
公共静态文件目录，直接映射到网站根路径：
- `favicon.ico`: 网站图标
- `custom-elements/`: 自定义 Web Components
- `plugins/`: 插件文件
- `vendors/`: 第三方库文件

### samples/
示例数据文件，用于测试和开发：
- 包含各种类型的微信文章 HTML 样本
- 分类：普通图文、图片分享、文本分享、文章分享、内容违规等

### server/
Nuxt 服务端代码目录：
- `api/`: 服务端 API 路由
  - `web/`: 微信平台代理接口
  - `public/`: 公开 API 接口
- `kv/`: KV 存储相关代码
- `utils/`: 服务端工具函数
  - `CookieStore.ts`: Cookie 存储管理
  - `logger.ts`: 日志工具
  - `proxy-request.ts`: 代理请求处理

### shared/
前后端共享代码目录：
- `utils/`: 共享工具函数
  - `helpers.ts`: 通用辅助函数
  - `html.ts`: HTML 处理函数
  - `request.ts`: 请求相关函数

### store/
数据存储层，使用 Dexie (IndexedDB)：
- `v2/`: 当前版本的存储实现
  - `db.ts`: 数据库初始化和版本管理
  - `article.ts`: 文章数据操作
  - `info.ts`: 公众号信息操作
  - `html.ts`: HTML 内容存储
  - `metadata.ts`: 元数据存储
  - `comment.ts`: 评论数据存储
  - `comment_reply.ts`: 评论回复存储
  - `assets.ts`: 资源文件存储
  - `resource.ts`: 下载资源存储
  - `resource-map.ts`: 资源映射存储

### test/
测试文件目录：
- `common.ts`: 通用测试工具
- `normalize_html.ts`: HTML 规范化测试
- `parse_cgi_data.ts`: CGI 数据解析测试
- `validate_html_content.ts`: HTML 内容验证测试

### types/
TypeScript 类型定义文件：
- `account.d.ts`: 公众号账号类型
- `article.d.ts`: 文章类型
- `comment.d.ts`: 评论类型
- `credential.d.ts`: 认证凭据类型
- `preferences.d.ts`: 用户偏好类型
- `proxy.d.ts`: 代理相关类型
- `types.d.ts`: 通用类型定义
- `video.d.ts`: 视频相关类型
- `album.d.ts`: 专辑类型
- `profile_getmsg.d.ts`: 消息获取类型

### utils/
工具函数目录：
- `index.ts`: 主工具函数集合（包含大量 HTML 处理、数据转换等函数）
- `download/`: 下载相关模块
  - `Downloader.ts`: 核心下载器类
  - `Exporter.ts`: 多格式导出器类
  - `BaseDownloader.ts`: 下载器基类
  - `ProxyManager.ts`: 代理管理器
  - `constants.ts`: 常量定义
  - `types.d.ts`: 下载模块类型
- `album.ts`: 专辑处理函数
- `comment.ts`: 评论处理函数
- `exporter.ts`: 导出辅助函数
- `grid.ts`: AG-Grid 辅助函数
- `pool.ts`: 并发池管理

## 开发命令

### 环境配置
```bash
# 启用 corepack 并安装 yarn
corepack enable
corepack prepare yarn@1.22.22 --activate

# 安装依赖
yarn

# 复制环境变量配置
cp .env.example .env
```

### 常用命令
```bash
# 启动开发服务器
yarn dev

# 启动开发服务器（带调试）
yarn debug

# 构建生产版本
yarn build

# 预览 Cloudflare Pages 构建
yarn preview

# 代码格式化（使用 Biome）
yarn format

# Docker 构建
yarn docker:build

# Docker 发布
yarn docker:publish
```

## 核心架构

### 1. 数据流架构

项目采用 **客户端渲染 (SSR: false)** + **IndexedDB 本地存储** 的架构：

```
用户登录 → 微信公众号平台 API → 文章列表/内容抓取 → IndexedDB 缓存 → 导出多种格式
```

**关键点**:
- 所有数据抓取通过微信公众号平台的搜索文章接口实现
- 使用 Dexie 封装 IndexedDB 进行本地数据持久化
- 支持两种认证方式：公众号平台登录 + Credentials（用于阅读量/评论）

### 2. 数据存储层 (store/v2/)

使用 Dexie (IndexedDB) 管理本地数据，数据库名称: `exporter.wxdown.online`

**核心表结构**:
- `info`: 公众号信息 (主键: fakeid)
- `article`: 文章列表缓存 (主键: fakeid:aid)
- `html`: 文章 HTML 内容 (主键: url)
- `metadata`: 阅读量/点赞量等元数据 (主键: url)
- `comment`: 评论数据 (主键: url)
- `comment_reply`: 评论回复 (主键: url:contentID)
- `asset`: 文章资源文件 (主键: url)
- `resource`: 下载的资源文件 (主键: url)
- `resource-map`: 资源映射关系 (主键: url)

**数据库版本管理**: 当前版本 v3，使用 Dexie 的版本迁移机制

### 3. API 层 (apis/index.ts)

封装了与微信公众号平台的交互接口：

- `getArticleList()`: 获取文章列表（带缓存机制）
- `getAccountList()`: 搜索公众号
- `getComment()`: 获取评论（需要 credentials）
- `getArticleListWithCredential()`: 使用微信接口获取文章（需要 credentials）

**认证机制**:
- 基础功能：使用公众号平台 session（通过扫码登录）
- 高级功能（阅读量/评论）：需要抓包获取 credentials (biz, uin, key, pass_ticket)

### 4. 下载与导出模块 (utils/download/)

**核心类**:
- `Downloader`: 文章内容/元数据/评论的批量下载器
  - 支持三种下载类型: `html`, `metadata`, `comments`
  - 基于事件驱动架构，发出进度、完成、失败等事件
  - 使用队列管理并发请求

- `Exporter`: 多格式导出器
  - 支持格式: HTML (zip), JSON, Excel, TXT, Markdown, DOCX
  - HTML 导出会打包所有资源文件（图片、样式）以保证 100% 还原

- `ProxyManager`: 代理管理器（用于绕过 CORS 限制）

**下载流程**:
```
URL 列表 → Downloader → 抓取内容 → 存入 IndexedDB → Exporter → 生成文件 → 下载
```

### 5. Composables 层

**核心 Composables**:
- `useDownloader()`: 封装下载逻辑，提供进度追踪
- `useExporter()`: 封装导出逻辑
- `useBatchDownload()`: 批量下载管理
- `useLoginAccount()`: 登录账号状态管理
- `usePreferences()`: 用户偏好设置

### 6. 服务端 API (server/api/)

Nuxt 服务端 API 主要用于：
- 代理微信公众号平台请求（绕过 CORS）
- KV 存储（支持 memory/fs/cloudflare-kv-binding）
- 提供公开 API 接口

**KV 存储配置**:
- 本地/Docker: `NITRO_KV_DRIVER=fs`
- Cloudflare: `NITRO_KV_DRIVER=cloudflare-kv-binding`

## 关键技术细节

### 文章抓取原理

利用微信公众号平台的"搜索其他公众号文章"功能：
1. 用户扫码登录公众号平台
2. 通过 `/api/web/mp/searchbiz` 搜索目标公众号
3. 通过 `/api/web/mp/appmsgpublish` 获取文章列表
4. 文章列表会缓存到 IndexedDB，减少 API 请求

### 阅读量/评论抓取

需要额外的 credentials（通过抓包获取）：
- `__biz`: 公众号标识
- `uin`: 用户 ID
- `key`: 认证密钥
- `pass_ticket`: 通行票据

这些参数用于调用微信客户端接口获取阅读量和评论数据。

### 资源处理

HTML 导出时会：
1. 解析文章中的所有资源链接（图片、视频、样式）
2. 下载资源到本地（存入 IndexedDB）
3. 替换资源链接为本地路径
4. 打包成 ZIP 文件

### 并发控制

使用 `p-queue` 库控制并发请求数量，避免触发微信平台的限流机制。

## 部署方式

### 1. 本地开发
```bash
yarn dev
```

### 2. Docker 部署
```bash
yarn docker:build
yarn docker:publish
```

### 3. Cloudflare Pages 部署
```bash
yarn preview
```

需要配置环境变量：
- `NITRO_KV_DRIVER=cloudflare-kv-binding`
- 绑定 KV 命名空间

## 环境变量

参考 `.env.example`:

- `NUXT_DEBUG_MP_REQUEST`: 调试微信代理请求（仅开发环境）
- `NUXT_AGGRID_LICENSE`: AG-Grid 企业版授权
- `NITRO_KV_DRIVER`: KV 存储驱动 (memory/fs/cloudflare-kv-binding)
- `NITRO_KV_BASE`: KV 存储路径（fs 驱动使用）
- `NUXT_SENTRY_DSN`: Sentry 错误追踪
- `NUXT_UMAMI_ID`: Umami 统计 ID

## 代码风格

- 使用 **Biome** 进行代码格式化和 lint
- 变量命名采用 **camelCase**
- 运行 `yarn format` 自动格式化代码
- TypeScript 严格模式

## 重要注意事项

1. **不要修改数据库结构**：如需修改，必须添加新的 Dexie 版本迁移
2. **API 请求限流**：微信平台有限流机制，注意控制并发数
3. **Session 过期处理**：当 API 返回 `ret: 200003` 时表示 session 过期，需重新登录
4. **资源下载失败处理**：部分资源可能因防盗链失败，需使用代理
5. **CORS 处理**：所有微信 API 请求通过 Nuxt 服务端代理

## 测试

项目包含 `test/` 目录，但具体测试命令需查看 package.json。

## 相关文档

- 在线文档站: https://docs.mptext.top
- 在线使用: https://down.mptext.top
- GitHub Issues: https://github.com/wechat-article/wechat-article-exporter/issues
