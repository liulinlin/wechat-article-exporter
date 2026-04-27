import { getTokenFromStore } from '~/server/utils/CookieStore';
import { proxyMpRequest } from '~/server/utils/proxy-request';

export default defineEventHandler(async event => {
  const token = await getTokenFromStore(event);
  if (!token) {
    return { code: -1, msg: '未登录或登录已过期，请重新扫码登录' };
  }

  const { fakeid, begin = 0, size = 20, keyword = '' } = getQuery(event);
  if (!fakeid) {
    return { code: -1, msg: '缺少 fakeid 参数' };
  }

  const isSearching = !!keyword;

  const result: any = await proxyMpRequest({
    event,
    method: 'GET',
    endpoint: 'https://mp.weixin.qq.com/cgi-bin/appmsgpublish',
    query: {
      sub: isSearching ? 'search' : 'list',
      search_field: isSearching ? '7' : 'null',
      begin,
      count: size,
      query: keyword,
      fakeid,
      type: '101_1',
      free_publish_type: 1,
      sub_action: 'list_ex',
      token,
      lang: 'zh_CN',
      f: 'json',
      ajax: 1,
    },
    parseJson: true,
  });

  // 微信返回的 publish_page 是双重编码的 JSON 字符串，解析还原
  if (result?.publish_page && typeof result.publish_page === 'string') {
    try {
      result.publish_page = JSON.parse(result.publish_page);
    } catch {}
  }

  return result;
});
