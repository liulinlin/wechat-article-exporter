import { type CookieEntity } from '~/server/utils/CookieStore';

export type CookieKVKey = string;

export interface CookieKVValue {
  token: string;
  cookies: CookieEntity[];
  nickname?: string;
}

export async function setMpCookie(key: CookieKVKey, data: CookieKVValue): Promise<boolean> {
  const kv = useStorage('kv');
  try {
    // 取 cookies 中最早的过期时间戳（排除永久 cookie），计算 TTL（秒）
    const now = Date.now();
    const minExpires = data.cookies
      .map(c => Number(c.expires_timestamp))
      .filter(ts => ts > now && ts < 4294967295000)
      .sort((a, b) => a - b)[0];
    const ttl = minExpires ? Math.floor((minExpires - now) / 1000) : 60 * 60 * 24 * 4;

    await kv.set<CookieKVValue>(`cookie:${key}`, data, { ttl });
    return true;
  } catch (err) {
    console.error('kv.set call failed:', err);
    return false;
  }
}

export async function getMpCookie(key: CookieKVKey): Promise<CookieKVValue | null> {
  const kv = useStorage('kv');
  return await kv.get<CookieKVValue>(`cookie:${key}`);
}

export async function updateMpCookieNickname(key: CookieKVKey, nickname: string): Promise<void> {
  const kv = useStorage('kv');
  const data = await kv.get<CookieKVValue>(`cookie:${key}`);
  if (data) {
    data.nickname = nickname;
    await kv.set<CookieKVValue>(`cookie:${key}`, data);
  }
}

export async function deleteMpCookie(key: CookieKVKey): Promise<void> {
  const kv = useStorage('kv');
  await kv.removeItem(`cookie:${key}`);
}
