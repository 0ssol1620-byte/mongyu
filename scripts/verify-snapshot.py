from pathlib import Path
import hashlib,json,re
root=Path(__file__).resolve().parents[1];web=root/'web';data=(web/'MONGYU_R89.html').read_bytes();html=data.decode('utf-8');manifest=json.loads((web/'build-manifest.json').read_text());assert hashlib.sha256(data).hexdigest()==manifest['sha256'];scripts=re.findall(r'<script>([\s\S]*?)</script>',html)
for name in json.loads((web/'sources.json').read_text()):
 source=(web/'src'/name).read_text(encoding='utf-8');assert scripts.count(source)==1,name
assert "connect-src 'none'" in html
assert '/*MOBILE_CSS*/' not in html and '<!--SCRIPTS-->' not in html
print('R89 exact artifact: all source modules, pinned assets and offline policy verified')
