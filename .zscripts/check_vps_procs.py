import subprocess

out = subprocess.check_output(['ps', '-ef']).decode()
for line in out.splitlines():
    if any(k in line.lower() for k in ['cloudflared', 'clean', 'player', '5050', '8088', '8089', 'trycloudflare']):
        print(line)
