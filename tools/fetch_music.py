"""Fetch pinned third-party music; regenerate the original cue when missing."""
from pathlib import Path
import hashlib,json,subprocess,sys,urllib.request
root=Path(__file__).resolve().parents[1];folder=root/'web/assets/music';manifest=json.loads((folder/'manifest.json').read_text())
for item in manifest['tracks']:
 if item.get('masterSha256'):
  from prepare_licensed_scores import restore
  restore(item)
  continue
 target=folder/item['file']
 if target.exists():
  assert hashlib.sha256(target.read_bytes()).hexdigest()==item['sha256'],target
  continue
 if item['id'].startswith('chapter-') or item['id']=='heart-circuit':
  subprocess.run([sys.executable,str(root/'tools/compose_chapter_scores.py')],check=True)
  continue
 if item['id']=='night-corners':
  subprocess.run([sys.executable,str(root/'tools/compose_night_score.py')],check=True)
  continue
 req=urllib.request.Request(item['downloadUrl'],headers={'User-Agent':'MONGYU-asset-builder/80'})
 with urllib.request.urlopen(req,timeout=90) as response:data=response.read()
 if item.get('strippedPrefixBytes') and data[:3]!=b'ID3':data=data[item['strippedPrefixBytes']:]
 assert hashlib.sha256(data).hexdigest()==item['sha256'],'Pinned audio mismatch; original file was not replaced'
 target.write_bytes(data)
print('Music assets ready')
