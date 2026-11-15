"""Build the offline R80 game. Assets are pinned, credits are bundled."""
from pathlib import Path
import base64, hashlib, json, argparse
parser=argparse.ArgumentParser();parser.add_argument('--release',choices=['R92','R94'],default='R92');release=parser.parse_args().release
p=Path(__file__).resolve().parent
def digest(data): return hashlib.sha256(data).hexdigest()
def asset(folder,item):
    path=(folder/item['file']).resolve()
    assert path.is_relative_to(folder.resolve()), 'Asset path escaped root'
    data=path.read_bytes()
    assert digest(data)==item['sha256'], f"Asset changed: {item['file']}"
    return 'data:'+item['mime']+';base64,'+base64.b64encode(data).decode()
# Retired prototype art is not embedded in the shipped edition.
images={}
manifest=json.loads((p/'assets/music/manifest.json').read_text(encoding='utf-8'))
assert all((p/'assets/music'/f).is_file() for f in ['CC-BY-4.0.txt','MUSIC-CREDITS.txt'])
music={t['id']:{**t,'src':asset(p/'assets/music',t)} for t in manifest['tracks']}
files=json.loads((p/'sources.json').read_text(encoding='utf-8'))
assert files[-1]=='app.js' and len(files)==len(set(files))
sources=['globalThis.MONGYU_EMBEDDED_IMAGES='+json.dumps(images,separators=(',',':'))+';', 'globalThis.MONGYU_EMBEDDED_MUSIC='+json.dumps(music,separators=(',',':'))+';']
source_hashes={}
for f in files:
    data=(p/'src'/f).read_bytes().replace(b'\r\n',b'\n');source_hashes[f]=digest(data);sources.append(data.decode('utf-8'))
template=(p/'index.template.html').read_text(encoding='utf-8')
assert template.count('<!--SCRIPTS-->')==1 and template.count('/*MOBILE_CSS*/')==1
out=template.replace('/*MOBILE_CSS*/',(p/'mobile.css').read_text(encoding='utf-8')).replace('<!--SCRIPTS-->','\n'.join('<script>'+s+'</script>' for s in sources))
assert "connect-src 'none'" in out and "default-src 'none'" in out
assert not any(x in out for x in ['NOM3_ASSETS','Nom3Study','menu-7.png','nom1-0.png'])
if release=='R94':out=out.replace('<title>몽유 · MONGYU R86</title>','<title>몽유 · MONGYU R94</title>')
data=out.encode('utf-8');(p/f'MONGYU_{release}.html').write_bytes(data)
report={'release':release,'bytes':len(data),'sha256':digest(data),'sourceCount':len(files),'sources':source_hashes,'audio':[{k:t[k] for k in ['id','sha256','bytes','license']} for t in manifest['tracks']]}
(p/'build-manifest.json').write_bytes((json.dumps(report,indent=2)+'\n').encode('utf-8'))
print(json.dumps({k:v for k,v in report.items() if k!='sources'}))
