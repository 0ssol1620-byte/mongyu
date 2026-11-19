"""Stage a standalone offline game. No original-file import or download is needed."""
from pathlib import Path
import hashlib,json,shutil,subprocess,sys
root=Path(__file__).resolve().parents[1]
subprocess.run([sys.executable,'web/build.py','--release','R95'],cwd=root,check=True)
source=root/'web/MONGYU_R95.html';data=source.read_bytes()
assert b'QUAD_RIFT_APP' in data and b'id="titleContinue"' in data
assert not any(t in data for t in [b'chooseOriginal',b'MongyuOriginal',b'fileInput',b'wie_web_bg.wasm'])
target=root/'android/app/src/main/assets'
if target.exists():shutil.rmtree(target)
target.mkdir(parents=True);(target/'index.html').write_bytes(data)
report={'release':'R95','requiresUserOriginalFile':False,'commercialOriginalPayloadIncluded':False,'files':[{'path':'index.html','bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}]}
(root/'android/expected-playable-assets.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8');(root/'android/expected-asset.sha256').write_text(report['files'][0]['sha256']+'\n',encoding='utf-8')
print(json.dumps({'release':'R95','requiresUserOriginalFile':False,'packagedFiles':1,'bytes':len(data)}))
