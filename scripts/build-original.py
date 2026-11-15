"""Build the original-file player. No commercial game file may be staged."""
from pathlib import Path
import hashlib,json,shutil
root=Path(__file__).resolve().parents[1];source=root/'web/original';target=root/'android/app/src/main/assets'
manifest=json.loads((source/'vendor/manifest.json').read_text())
for item in manifest['files']:
 data=(source/item['path']).read_bytes();assert len(data)==item['bytes'] and hashlib.sha256(data).hexdigest()==item['sha256'],item['path']
files=['index.html','styles.css','main.mjs','runtime.mjs','storage.mjs','archive.mjs']+[x['path'] for x in manifest['files']]+[str(p.relative_to(source)) for p in (source/'licenses').iterdir() if p.is_file()]
assert not any(p.suffix.lower() in {'.zip','.jar','.bin','.pzx','.mmf','.mp3','.apk','.jks'} for p in source.rglob('*') if p.is_file())
if target.exists():shutil.rmtree(target)
for name in files:
 destination=target/name;destination.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source/name,destination)
report={'release':'R93','gamePayloadIncluded':False,'files':[{'path':name,'bytes':(source/name).stat().st_size,'sha256':hashlib.sha256((source/name).read_bytes()).hexdigest()} for name in sorted(files)]}
(root/'android/expected-original-assets.json').write_text(json.dumps(report,indent=2)+'\n');(root/'android/expected-asset.sha256').write_text(hashlib.sha256((source/'index.html').read_bytes()).hexdigest()+'\n')
print(json.dumps({'release':'R93','packagedFiles':len(files),'bytes':sum(x['bytes'] for x in report['files']),'commercialGameIncluded':False}))
