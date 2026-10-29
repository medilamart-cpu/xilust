import time
import urllib.request
import json

token = "cfoat_flrkbwZb9wsYKdhp7xteqjsAeq-ltlb4arn8HL5qUnY.PFCIum85j-OvJ4owV4Ig8nB4GidPIKSxH0-QZhydoO4"
dep_id = "4679a3a5-9859-4b96-a0bb-b91c75511378"
url = f"https://api.cloudflare.com/client/v4/accounts/87e42b045dc2182ef8f54bd33ea8ee30/pages/projects/xilust/deployments/{dep_id}"
req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})

for i in range(25):
    try:
        data = json.loads(urllib.request.urlopen(req, timeout=10).read())
        stage = data["result"]["latest_stage"]
        name = stage.get("name")
        status = stage.get("status")
        print(f"[{i*6}s] Stage: {name}, Status: {status}")
        if name == "deploy" and status == "success":
            print("SUCCESS: Deployment finished!")
            break
        if status == "failure":
            print("FAILURE: Deployment failed!")
            break
    except Exception as e:
        print("Check error:", e)
    time.sleep(6)
