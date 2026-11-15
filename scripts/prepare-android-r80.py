"""Stage R89 web payload and version metadata; never signs or installs."""
from pathlib import Path
import hashlib,re
root=Path(__file__).resolve().parents[1];src=root/'web/MONGYU_R89.html';assert src.is_file(),'Build web first'
data=src.read_bytes();dst=root/'android/app/src/main/assets/index.html';dst.parent.mkdir(parents=True,exist_ok=True);dst.write_bytes(data)
p=root/'android/expected-asset.sha256';p.write_text(hashlib.sha256(data).hexdigest()+'\n')
p=root/'android/app/src/main/AndroidManifest.xml';s=p.read_text();s=re.sub(r'android:versionCode="[^"]+"','android:versionCode="89"',s);s=re.sub(r'android:versionName="[^"]+"','android:versionName="0.89.0-preview"',s);p.write_text(s)
print('R89 HTML and manifest staged. Android compilation, signing and device tests remain separate.')
