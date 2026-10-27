from pathlib import Path
import hashlib,json,base64,re
p=Path(__file__).resolve().parent
manifest=json.loads((p/'assets/r10/manifest.json').read_text(encoding='utf-8'));bundle={}
for key,item in manifest.items():
 assert key in {'tidal','mirror','eclipse'}
 assert item['mime'] in {'image/webp','image/png'}
 path=p/'assets/r10'/item['file'];assert path.parent==p/'assets/r10'
 data=path.read_bytes();assert hashlib.sha256(data).hexdigest()==item['sha256']
 assert (item['mime']=='image/webp' and data[:4]==b'RIFF' and data[8:12]==b'WEBP') or (item['mime']=='image/png' and data[:8]==b'\x89PNG\r\n\x1a\n')
 bundle[key]='data:'+item['mime']+';base64,'+base64.b64encode(data).decode()
sources=['globalThis.MONGYU_EMBEDDED_IMAGES='+json.dumps(bundle,separators=(',',':'))+';']+[(p/'src'/f).read_text(encoding='utf-8') for f in ['assets.js','content.js','progression.js','origin-records.js','engine.js','render.js','tilt.js','journey-audio.js','square-reply.js','companion-bridge.js','day-night.js','app.js']]
template=(p/'index.template.html').read_text(encoding='utf-8').replace("img-src 'none'","img-src data:")
out=template.replace('<!--SCRIPTS-->','\n'.join('<script>'+s+'</script>' for s in sources))
for forbidden in ['NOM3_ASSETS','Gamevil','GAMEVIL','menu-7.png','nom1-0.png','Nom3Study']:
 assert forbidden not in out,forbidden
assert "connect-src 'none'" in out and "default-src 'none'" in out
assert set(re.findall(r'data:(image/[a-zA-Z+.-]+)',out)) <= {'image/webp','image/png'}
# Portable R31 snapshot: one canonical output; game bytes remain unchanged.
(p/'MONGYU_R31.html').write_bytes(out.encode('utf-8'))
print(len(out.encode('utf-8')),hashlib.sha256(out.encode('utf-8')).hexdigest())
