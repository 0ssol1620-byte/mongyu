"""Fetch a separately configured private QA reference; never publish game bytes."""
from pathlib import Path
import hashlib,os,urllib.request
url=os.environ.get('MONGYU_ORIGINAL_QA_URL');assert url and url.startswith('https://'),'Configure a lawful private QA reference URL'
request=urllib.request.Request(url,headers={'User-Agent':'MONGYU-local-compatibility-QA'})
try:
 with urllib.request.urlopen(request,timeout=90) as response:data=response.read(16*1024*1024+1)
except Exception:raise SystemExit('Could not fetch the private QA reference; no URL or payload is logged')
assert 22<=len(data)<=16*1024*1024
expected=os.environ.get('MONGYU_ORIGINAL_QA_SHA256','b665ede83645e56828cb9cc93a1d32ed60303cb5efee286865f84df183fa43c8')
assert hashlib.sha256(data).hexdigest()==expected,'QA reference digest differs; never silently substitute another game'
folder=Path('ci/private-original');folder.mkdir(parents=True,exist_ok=True);(folder/'original.zip').write_bytes(data)
print('Private QA reference verified. This directory must never be uploaded.')
