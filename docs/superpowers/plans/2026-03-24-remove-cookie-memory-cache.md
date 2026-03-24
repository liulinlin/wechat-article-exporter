# Remove CookieStore In-Memory Cache Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 去掉 `CookieStore` 中的内存 LRU 缓存层，所有 auth 读写直接走 Nitro KV Store，同时修复登出时 KV 条目未清理的 bug。

**Architecture:** 直接删除 `CookieStore` 类内部的 `Map` 字段及相关 LRU 逻辑，让每个方法直接调用 `server/kv/cookie.ts` 中的 KV 函数。新增 `deleteMpCookie` KV 函数支持登出删除。`logout.get.ts` 补加 `await`。

**Tech Stack:** Nuxt 3 / Nitro、`useStorage('kv')`（本地 `fs` 驱动 / Cloudflare KV binding）、TypeScript

---

## Chunk 1: 实现全部变更

### Task 1: 在 `server/kv/cookie.ts` 新增 `deleteMpCookie`

**Files:**
- Modify: `server/kv/cookie.ts`

- [ ] **Step 1: 打开文件确认现状**

  阅读 `server/kv/cookie.ts`，确认现有 `setMpCookie` / `getMpCookie` 函数结构。

- [ ] **Step 2: 在文件末尾追加 `deleteMpCookie`**

  在 `server/kv/cookie.ts` 末尾添加：

  ```typescript
  export async function deleteMpCookie(key: CookieKVKey): Promise<void> {
    const kv = useStorage('kv');
    await kv.removeItem(`cookie:${key}`);
  }
  ```

  > 注意：`removeItem` 失败时直接向上抛出异常，不捕获，调用方（`removeCookie`）感知失败。与 `setMpCookie` 的 try/catch 不同，登出场景需要失败可见性。

- [ ] **Step 3: 确认 TypeScript 无报错**

  ```bash
  yarn build 2>&1 | grep -E "error|Error" | head -20
  ```

  预期：无 TypeScript 编译错误。

- [ ] **Step 4: Commit**

  ```bash
  git add server/kv/cookie.ts
  git commit -m "feat: add deleteMpCookie to kv/cookie"
  ```

---

### Task 2: 重构 `CookieStore` 类——删除内存缓存层

**Files:**
- Modify: `server/utils/CookieStore.ts`
- Modify: `server/api/_debug.get.ts`

- [ ] **Step 1: 更新 import，引入 `deleteMpCookie`**

  将文件顶部的 import 行：

  ```typescript
  import { CookieKVValue, getMpCookie, setMpCookie } from '~/server/kv/cookie';
  ```

  改为：

  ```typescript
  import { CookieKVValue, deleteMpCookie, getMpCookie, setMpCookie } from '~/server/kv/cookie';
  ```

- [ ] **Step 2: 删除 `CookieStore` 类中的内存字段**

  删除以下两个字段声明（约第 113–116 行）：

  ```typescript
  // key 为 authKey, value 为 AccountCookie 实例
  // 使用 Map 的插入顺序特性实现 LRU 淘汰
  store: Map<string, AccountCookie> = new Map<string, AccountCookie>();

  // 内存缓存最大条目数，防止无限增长
  private readonly maxSize: number = 1000;
  ```

- [ ] **Step 3: 替换 `getAccountCookie` 方法**

  将原方法（含内存命中/写回/LRU 逻辑）整体替换为：

  ```typescript
  async getAccountCookie(authKey: string): Promise<AccountCookie | null> {
    const cookieValue = await getMpCookie(authKey);
    if (!cookieValue) {
      return null;
    }
    return AccountCookie.create(cookieValue.token, cookieValue.cookies);
  }
  ```

- [ ] **Step 4: 替换 `setCookie` 方法**

  将原方法（含 `store.delete`、`evictIfNeeded`、`store.set`）整体替换为：

  ```typescript
  async setCookie(authKey: string, token: string, cookie: string[]): Promise<boolean> {
    const accountCookie = new AccountCookie(token, cookie);
    return await setMpCookie(authKey, accountCookie.toJSON());
  }
  ```

- [ ] **Step 5: 替换 `removeCookie` 方法**

  将原同步方法：

  ```typescript
  removeCookie(authKey: string): void {
    this.store.delete(authKey);
  }
  ```

  替换为：

  ```typescript
  async removeCookie(authKey: string): Promise<void> {
    await deleteMpCookie(authKey);
  }
  ```

- [ ] **Step 6: 删除 `evictIfNeeded` 私有方法**

  删除以下方法（约第 181–191 行）：

  ```typescript
  private evictIfNeeded(): void {
    while (this.store.size >= this.maxSize) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
      } else {
        break;
      }
    }
  }
  ```

- [ ] **Step 7: 更新 `_debug.get.ts`，移除对 `toJSON()` 的调用**

  `server/api/_debug.get.ts` 调用了 `cookieStore.toJSON()`，该方法在内存缓存移除后将不再存在。
  将 `_debug.get.ts` 全文替换为（去掉内存 dump，改为提示已迁移到 KV）：

  ```typescript
  export default defineEventHandler(async event => {
    const { key } = getQuery<{ key: string }>(event);
    if (key && key === process.env.DEBUG_KEY) {
      return { message: 'In-memory cookie cache has been removed. Auth data is stored in KV only.' };
    } else {
      return 'not set debug key';
    }
  });
  ```

  > 同时删除顶部 `import { cookieStore } from '~/server/utils/CookieStore';` 这行，因为不再引用 `cookieStore`。

- [ ] **Step 8: 删除 `CookieStore.ts` 中的 `toJSON` 方法**

  删除以下方法（约第 210–216 行）：

  ```typescript
  toJSON(): Record<string, AccountCookie> {
    const json: Record<string, AccountCookie> = {};
    for (const [authKey, accountCookie] of this.store) {
      json[authKey] = accountCookie;
    }
    return json;
  }
  ```

- [ ] **Step 9: 更新 `getToken` 方法注释**

  原注释提到"内存/KV 两层"，按需修改为直接说明走 KV 即可（非强制，视情况而定）。

- [ ] **Step 10: 确认 TypeScript 无报错**

  ```bash
  yarn build 2>&1 | grep -E "error|Error" | head -20
  ```

  预期：无编译错误。

- [ ] **Step 11: Commit**

  ```bash
  git add server/utils/CookieStore.ts server/api/_debug.get.ts
  git commit -m "refactor: remove in-memory LRU cache from CookieStore, read/write KV directly"
  ```

---

### Task 3: 修复 `logout.get.ts` — 补加 `await`

**Files:**
- Modify: `server/api/web/mp/logout.get.ts`

- [ ] **Step 1: 找到 `removeCookie` 调用行**

  打开 `server/api/web/mp/logout.get.ts`，找到（约第 28–30 行）：

  ```typescript
  if (authKey) {
    cookieStore.removeCookie(authKey);
  }
  ```

- [ ] **Step 2: 加上 `await` 并更新注释**

  改为：

  ```typescript
  if (authKey) {
    // 登出后立即从 KV 中删除 session，使 auth-key 立即失效
    await cookieStore.removeCookie(authKey);
  }
  ```

- [ ] **Step 3: 确认 TypeScript 无报错**

  ```bash
  yarn build 2>&1 | grep -E "error|Error" | head -20
  ```

  预期：无编译错误。

- [ ] **Step 4: Commit**

  ```bash
  git add server/api/web/mp/logout.get.ts
  git commit -m "fix: await removeCookie in logout to ensure KV deletion completes"
  ```

---

### Task 4: 手动功能验证

本项目无自动化测试框架，以下为手动验证步骤。

- [ ] **Step 1: 启动开发服务器**

  ```bash
  yarn dev
  ```

- [ ] **Step 2: 验证登录后 API 可用**

  1. 扫码登录，获取 `auth-key` cookie
  2. 打开任意文章列表页，确认文章数据正常加载
  3. 重启开发服务器（`Ctrl+C` → `yarn dev`）
  4. 重启后刷新页面，确认无需重新登录（验证 KV 持久化）

- [ ] **Step 3: 验证登出后 session 立即失效**

  1. 点击登出
  2. 手动用相同的 `auth-key` 发一次 API 请求（浏览器 DevTools 或 curl）
  3. 确认返回 401 / 未认证响应（验证 KV 条目已删除）

- [ ] **Step 4: 确认内存字段已彻底消失**

  全局搜索 `cookieStore.store`，确认无任何外部代码直接访问内存 Map。

  ```bash
  grep -r "cookieStore\.store" server/
  ```

  预期：无匹配结果。
