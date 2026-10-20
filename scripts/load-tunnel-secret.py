"""Load this app's connector token from OpenBao without printing its value."""
import json
import os
from pathlib import Path
import subprocess
import urllib.request

base = os.environ['BAO_ADDR'].rstrip('/')
request = urllib.request.Request(
    base + '/v1/apps/data/flipbook',
    headers={
        'X-Vault-Token': os.environ['BAO_TOKEN'],
        'X-Vault-Namespace': os.environ.get('BAO_NAMESPACE', 'pragithai'),
    },
)
with urllib.request.urlopen(request, timeout=30) as response:
    token = json.load(response)['data']['data']['CLOUDFLARE_TUNNEL_TOKEN']
root = Path(__file__).resolve().parent.parent / '.secrets'
root.mkdir(mode=0o700, exist_ok=True)
path = root / 'cloudflare-tunnel-token'
fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
with os.fdopen(fd, 'w') as output:
    output.write(token)
# The official cloudflared image runs as UID 65532.
subprocess.run(['setfacl', '-m', 'u:65532:r', str(path)], check=True)
print('Loaded the Flipbook tunnel connector token into the ignored Compose secret file.')
