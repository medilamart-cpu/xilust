import re, urllib.request, json, os, time

path = os.path.expandvars(r"%APPDATA%\xdg.config\.wrangler\config\default.toml")
with open(path) as f:
    token = re.search(r'oauth_token\s*=\s*"([^"]+)"', f.read()).group(1)

# Check latest deployments or trigger
account_id = "87e42b045dc2182ef8f54bd33ea8ee30"
project = "xilust"

req = urllib.request.Request(
    f"https://api.cloudflare.com/client/v4/accounts/{account_id}/pages/projects/{project}/deployments",
    data=json.dumps({"branch": "main"}).encode(),
    headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
)

try:
    with urllib.request.urlopen(req) as resp:
        dep = json.loads(resp.read().decode())
        dep_id = dep["result"]["id"]
        print(f"Triggered deployment: {dep_id}")
except Exception as e:
    print(f"Trigger error: {e}")

# Poll status
for _ in range(30):
    time.sleep(5)
    chk_req = urllib.request.Request(
        f"https://api.cloudflare.com/client/v4/accounts/{account_id}/pages/projects/{project}/deployments?per_page=1",
        headers={"Authorization": f"Bearer {token}"}
    )
    with urllib.request.urlopen(chk_req) as resp:
        res = json.loads(resp.read().decode())["result"][0]
        status = res["latest_stage"]["status"]
        name = res["latest_stage"]["name"]
        print(f"Deployment {res['id']}: stage={name}, status={status}")
        if status in ("success", "failure"):
            break

