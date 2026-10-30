import re, urllib.request, json, os

path = os.path.expandvars(r"%APPDATA%\xdg.config\.wrangler\config\default.toml")
with open(path) as f:
    token = re.search(r'oauth_token\s*=\s*"([^"]+)"', f.read()).group(1)

req = urllib.request.Request(
    'https://api.cloudflare.com/client/v4/accounts/87e42b045dc2182ef8f54bd33ea8ee30/pages/projects/xilust/deployments?per_page=3',
    headers={'Authorization': f'Bearer {token}'}
)
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())
    for d in data['result']:
        print(d['id'], d['url'], d['latest_stage']['name'], d['latest_stage']['status'])

