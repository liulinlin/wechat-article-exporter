import dayjs from 'dayjs';
import { request } from '#shared/utils/request';
import { getCookieFromResponse, getCookiesFromRequest } from '~/server/utils/CookieStore';
import { deleteMpCookie, getMpCookie, setMpCookie } from '~/server/kv/cookie';
import { proxyMpRequest } from '~/server/utils/proxy-request';

export default defineEventHandler(async event => {
  const cookie = getCookiesFromRequest(event);

  const payload: Record<string, string | number> = {
    userlang: 'zh_CN',
    redirect_url: '',
    cookie_forbidden: 0,
    cookie_cleaned: 0,
    plugin_used: 0,
    login_type: 3,
    token: '',
    lang: 'zh_CN',
    f: 'json',
    ajax: 1,
  };

  const response: Response = await proxyMpRequest({
    event: event,
    method: 'POST',
    endpoint: 'https://mp.weixin.qq.com/cgi-bin/bizlogin',
    query: {
      action: 'login',
    },
    body: payload,
    cookie: cookie,
    action: 'login', // 有这个标志就会把微信原始响应中的所有 set-cookie 存储在 CookieStore 中，并返回给客户端一个唯一的cookie: auth-key=xxx
  });

  // 从响应中取出唯一的 set-cookie (即上一步 `action=login` 标志所设置的 auth-key=xxx)
  const authKey = getCookieFromResponse('auth-key', response);
  if (!authKey) {
    return {
      err: '登录失败，请稍后重试',
    };
  }

  const { nick_name, head_img } = await request(`/api/web/mp/info`, {
    headers: {
      Cookie: `auth-key=${authKey}`,
    },
  });
  if (!nick_name) {
    return {
      err: '获取公众号昵称失败，请稍后重试',
    };
  }

  const nicknameKey = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(nick_name))
    .then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32));

  // 用固定的 nickname MD5 key 重新存储，删除临时 key
  const existing = await getMpCookie(authKey);
  if (existing) {
    await setMpCookie(nicknameKey, { ...existing, nickname: nick_name });
    await deleteMpCookie(authKey);
  }

  const expires = dayjs().add(4, 'days').toString();
  const body = JSON.stringify({ nickname: nick_name, avatar: head_img, expires });
  const headers = new Headers(response.headers);
  // 重建 set-cookie，过滤掉旧的 auth-key，设置新的固定 MD5 key
  const newSetCookies = headers.getSetCookie().filter(c => !c.startsWith('auth-key='));
  headers.delete('set-cookie');
  for (const c of newSetCookies) headers.append('set-cookie', c);
  headers.append('set-cookie', `auth-key=${nicknameKey}; Path=/; Expires=${expires}; Secure; HttpOnly`);
  headers.set('Content-Length', new TextEncoder().encode(body).length.toString());
  return new Response(body, { headers: headers });
});
