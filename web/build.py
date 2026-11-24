"""Build the offline game with pinned assets and in-app credits."""
from pathlib import Path
import base64, hashlib, json, argparse
parser=argparse.ArgumentParser();parser.add_argument('--release',choices=['R92','R94','R95','R96','R97','R98','R99','R100','R101','R102','R103','R104','R105'],default='R92');release=parser.parse_args().release
dream_edition=release in ('R98','R99','R100','R101','R102','R103','R104','R105')
spectral_edition=release in ('R100','R101','R102','R103','R104','R105')
route_edition=release in ('R101','R102','R103','R104','R105')
stage_edition=release in ('R102','R103','R104','R105')
stage_hud=release in ('R103','R104','R105')
polish_edition=release in ('R104','R105')
ui_edition=release=='R105'
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
tracks={t['id']:t for t in manifest['tracks']}
effects={}
if dream_edition:
    additional=json.loads((p/'assets/music/r98-manifest.json').read_text(encoding='utf-8'))
    tracks.update((t['id'],t) for t in additional['tracks'])
    folder=p/'assets/effects'
    samples=json.loads((folder/'manifest.json').read_text(encoding='utf-8'))['samples']
    effects={name:{**item,'src':asset(folder,item).split(',',1)[1]} for name,item in samples.items()}
music={t['id']:{**t,'src':asset(p/'assets/music',t)} for t in tracks.values()}
files=json.loads((p/'sources.json').read_text(encoding='utf-8'))
assert files[-1]=='app.js' and len(files)==len(set(files))
sources=[f'globalThis.MONGYU_PLAYABLE_RELEASE={json.dumps(release)};globalThis.MONGYU_DREAM_EDITION={json.dumps(dream_edition)};globalThis.MONGYU_SPECTRAL_EDITION={json.dumps(spectral_edition)};globalThis.MONGYU_ROUTE_EDITION={json.dumps(route_edition)};globalThis.MONGYU_STAGE_EDITION={json.dumps(stage_edition)};globalThis.MONGYU_STAGE_HUD={json.dumps(stage_hud)};globalThis.MONGYU_POLISH_EDITION={json.dumps(polish_edition)};globalThis.MONGYU_UI_EDITION={json.dumps(ui_edition)};', 'globalThis.MONGYU_EMBEDDED_IMAGES='+json.dumps(images,separators=(',',':'))+';', 'globalThis.MONGYU_EMBEDDED_MUSIC='+json.dumps(music,separators=(',',':'))+';']
if effects:sources.append('globalThis.MONGYU_EMBEDDED_EFFECTS='+json.dumps(effects,separators=(',',':'))+';')
source_hashes={}
for f in files:
    data=(p/'src'/f).read_bytes().replace(b'\r\n',b'\n');source_hashes[f]=digest(data);sources.append(data.decode('utf-8'))
template=(p/'index.template.html').read_text(encoding='utf-8')
assert template.count('<!--SCRIPTS-->')==1 and template.count('/*MOBILE_CSS*/')==1
mobile_css=(p/'mobile.css').read_text(encoding='utf-8')
if polish_edition:mobile_css+=chr(10)+chr(10).join((p/'css'/f'r104-{name}.css').read_text(encoding='utf-8') for name in ['story','juice','hud','world','modes','road','ui'])
out=template.replace('/*MOBILE_CSS*/',mobile_css).replace('<!--SCRIPTS-->','\n'.join('<script>'+s+'</script>' for s in sources))
assert "connect-src 'none'" in out and "default-src 'none'" in out
assert not any(x in out for x in ['NOM3_ASSETS','Nom3Study','menu-7.png','nom1-0.png'])
if dream_edition:out=out.replace('<html lang=', '<html data-dream-edition="true" lang=',1)
if polish_edition:out=out.replace('<html ', '<html data-polish-edition="true" ',1)
if ui_edition:out=out.replace('<html ', '<html data-ui-edition="true" ',1)
if stage_hud:out=out.replace('<html ', '<html data-stage-hud="true" ',1)
if stage_edition:out=out.replace('<html ', '<html data-stage-edition="true" ',1)
if route_edition:out=out.replace('<html ', '<html data-route-edition="true" ',1)
if spectral_edition:
    folder=p/'assets/r100'
    artwork=json.loads((folder/'manifest.json').read_text(encoding='utf-8'))
    image=asset(folder,artwork)
    out=out.replace('<html ', '<html data-spectral-edition="true" ',1)
    out=out.replace('</head>',f'<style>html{{--dream-art:url({image})}}</style></head>',1)
if release in ('R99','R100','R101','R102','R103','R104','R105'):
    out=out.replace('<meta name="color-scheme"', '<meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="몽유"><meta name="color-scheme"',1)
if release!='R92':out=out.replace('<title>몽유 · MONGYU R86</title>',f'<title>몽유 · MONGYU {release}</title>')
data=out.encode('utf-8');(p/f'MONGYU_{release}.html').write_bytes(data)
report={'release':release,'bytes':len(data),'sha256':digest(data),'sourceCount':len(source_hashes),'sources':source_hashes,'audio':[{k:t[k] for k in ['id','sha256','bytes','license']} for t in tracks.values()], 'effects':[{k:t[k] for k in ['file','sha256','bytes','license']} for t in effects.values()]}
if spectral_edition:report['artwork']=artwork
(p/'build-manifest.json').write_bytes((json.dumps(report,indent=2)+'\n').encode('utf-8'))
print(json.dumps({k:v for k,v in report.items() if k!='sources'}))
