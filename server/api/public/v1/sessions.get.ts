import { getMpCookie } from '~/server/kv/cookie';

export default defineEventHandler(async () => {
  const kv = useStorage('kv');
  const keys = await kv.getKeys('cookie:');

  const sessions = await Promise.all(
    keys.map(async fullKey => {
      const authKey = fullKey.replace(/^cookie:/, '');
      const data = await getMpCookie(authKey);
      return data ? { authKey, nickname: data.nickname ?? '', expires: data.expires ?? 0 } : null;
    }),
  );

  return { sessions: sessions.filter(Boolean) };
});
