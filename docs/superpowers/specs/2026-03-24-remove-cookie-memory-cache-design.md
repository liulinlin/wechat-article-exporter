# 设计规格：去除 CookieStore 内存缓存，直接读写 KV

**日期：** 2026-03-24
**状态：** 待实现
**影响范围：** `server/utils/CookieStore.ts`、`server/kv/cookie.ts`

---

## 背景

当前微信公众号 auth（token + cookies）采用两层存储：

1. **内存 LRU 缓存**（`CookieStore` 类中的 `Map<string, AccountCookie>`，最多 1000 条）
2. **Nitro KV Store**（持久化，本地用 `fs` 驱动，Cloudflare 部署用 `cloudflare-kv-binding`）

在 Cloudflare Pages 的 Serverless 环境下，每个请求可能由不同的 Worker 实例处理，内存缓存无法跨实例共享，实际上从不命中。保留内存层在此场景下是无效的，并且增加了代码复杂度。

**目标：** 去掉内存缓存层，让所有 auth 读写操作直接走 KV，同时修复登出时 KV 条目未清理的 bug。

---

## 方案

**方案 A（选定）：改造 `CookieStore` 类，删除内存 Map，保持公共接口不变。**

所有调用方（约 25 个 server/api 端点）通过 `getCookieFromStore` / `getTokenFromStore` 访问，接口签名不变，零改动。

---

## 改动范围

### 文件 1：`server/kv/cookie.ts`

新增 `deleteMpCookie` 函数，用于登出时从 KV 中删除条目：

```typescript
export async function deleteMpCookie(key: CookieKVKey): Promise<void> {
  const kv = useStorage('kv');
  await kv.removeItem(`cookie:${key}`);
}
```

### 文件 2：`server/utils/CookieStore.ts`

**删除以下内容：**
- `store: Map<string, AccountCookie>` 字段
- `maxSize: number` 字段
- `evictIfNeeded()` 私有方法
- `getAccountCookie` 中的内存读写路径（命中返回 + 写回缓存）
- `setCookie` 中的内存写操作
- `toJSON()` 方法（依赖内存 Map，无外部调用方）

**改后的 `CookieStore` 方法实现：**

```typescript
async getAccountCookie(authKey: string): Promise<AccountCookie | null> {
  const cookieValue = await getMpCookie(authKey);
  if (!cookieValue) return null;
  return AccountCookie.create(cookieValue.token, cookieValue.cookies);
}

async getCookie(authKey: string): Promise<string | null> {
  const accountCookie = await this.getAccountCookie(authKey);
  if (!accountCookie) return null;
  return accountCookie.toString();
}

async setCookie(authKey: string, token: string, cookie: string[]): Promise<boolean> {
  const accountCookie = new AccountCookie(token, cookie);
  return await setMpCookie(authKey, accountCookie.toJSON());
}

async removeCookie(authKey: string): Promise<void> {
  await deleteMpCookie(authKey);
}

async getToken(authKey: string): Promise<string | null> {
  const accountCookie = await this.getAccountCookie(authKey);
  if (!accountCookie) return null;
  return accountCookie.token;
}
```

---

## 数据流（改后）

```
客户端请求（携带 auth-key cookie 或 X-Auth-Key header）
  ↓
getCookieFromStore(event)
  ↓
cookieStore.getCookie(authKey)
  ↓
getMpCookie(authKey)  ← 直接读 KV，无内存层
  ↓
AccountCookie.create(token, cookies)
  ↓
accountCookie.toString()  → Cookie 字符串
  ↓
转发给微信 API
```

---

## Bug 修复

`removeCookie` 原实现仅删除内存 Map 中的条目，KV 中的 session 依靠 4 天 TTL 自然过期。
改后 `removeCookie` 调用 `deleteMpCookie`，登出时立即从 KV 中删除，session 不再有效。

---

## 不变部分

- `AccountCookie` 类（cookie 解析、序列化逻辑）完全保留
- `cookieStore` 单例导出不变
- `getCookieFromStore`、`getTokenFromStore`、`getCookiesFromRequest`、`getCookieFromResponse` 函数签名不变
- 所有 server/api 端点调用方无需修改
- 本地开发（`fs` 驱动）和 Cloudflare 部署（`cloudflare-kv-binding`）均透明兼容

---

## 性能说明

| 场景 | 改前（内存命中） | 改前（内存未命中） | 改后 |
|------|-----------------|-------------------|------|
| 本地开发 | ~0ms | ~1ms（fs） | ~1ms（fs） |
| Cloudflare Pages | 不可靠（跨实例不共享） | ~1ms（KV） | ~1ms（KV） |

在 Cloudflare Serverless 环境下，内存缓存命中率接近 0，去除后性能无实质损失。

---

## 测试要点

1. 登录后，通过 API 请求（携带 `auth-key`）能正常代理到微信
2. 重启服务后，已登录用户仍可正常使用（KV 持久化验证）
3. 登出后，再次发起 API 请求返回未认证（KV 条目已删除验证）
4. 多实例/重部署后，auth 状态不丢失
