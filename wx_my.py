import requests

url = "https://wechat-article-exporter-8iq.pages.dev/api/public/v1/article?fakeid=Mzg3MDEwNDEyMg=="

payload = {}
headers = {
    'accept': '*/*',
    'accept-language': 'en,zh-CN;q=0.9,zh;q=0.8',
    'cache-control': 'no-cache',
    'pragma': 'no-cache',
    'priority': 'u=1, i',
    'sec-ch-ua': '"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
    'Cookie': 'auth-key=c5a28cf2663143ae8b42be48b7968492',
}

response = requests.request("GET", url, headers=headers, data=payload)
print(response.text)
import json

print(json.dumps(response.json(), indent=4, ensure_ascii=False))
