"""Fetch a separately configured private QA reference; never publish game bytes."""
from pathlib import Path
import hashlib,os,urllib.request,re,html,zipfile,io,json
url=os.environ.get('MONGYU_ORIGINAL_QA_URL')
if not url:
 # External research reference; game bytes remain temporary and are never distributed.
 request=urllib.request.Request('https://dubigame.tistory.com/16',headers={'User-Agent':'Mozilla/5.0'})
 with urllib.request.urlopen(request,timeout=30) as response:page=response.read(262144).decode('utf-8')
 links=[html.unescape(x) for x in re.findall(r'''href=["']([^"']+)''',page) if 'blog.kakaocdn.net' in x and '.zip?' in x]
 assert len(links)==1,'External reference is unavailable; supply MONGYU_ORIGINAL_QA_URL'
 url=links[0]
assert url.startswith('https://'),'HTTPS reference required'
request=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'})
try:
 with urllib.request.urlopen(request,timeout=90) as response:data=response.read(16*1024*1024+1)
except Exception:raise SystemExit('Could not fetch the private QA reference; no URL or payload is logged')
assert 22<=len(data)<=16*1024*1024
expected=os.environ.get('MONGYU_ORIGINAL_QA_SHA256','b665ede83645e56828cb9cc93a1d32ed60303cb5efee286865f84df183fa43c8')
assert hashlib.sha256(data).hexdigest()==expected,'QA reference digest differs; never silently substitute another game'
folder=Path('ci/private-original');folder.mkdir(parents=True,exist_ok=True)
# The public research bundle includes someone else's old progress. A new-game QA
# fixture omits only p/ save records; executable and media entries remain identical.
with zipfile.ZipFile(io.BytesIO(data)) as source,zipfile.ZipFile(folder/'original.zip','w') as fresh:
 for item in source.infolist():
  if not item.filename.startswith('p/'):fresh.writestr(item,source.read(item.filename))
(folder/'fixture-metadata.json').write_text(json.dumps({'scope':'Fresh original game: only preexisting p/ save entries omitted, no code/media changes or injected progress','sourceArchiveSha256':expected,'freshArchiveSha256':hashlib.sha256((folder/'original.zip').read_bytes()).hexdigest()},indent=2)+'\n')
print('Private QA reference verified. This directory must never be uploaded.')
