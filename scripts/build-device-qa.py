"""Two same-certificate QA packages. Never uses or exports the preview key."""
from pathlib import Path
import os,subprocess
root=Path(__file__).resolve().parents[1];out=root/'ci';out.mkdir(exist_ok=True)
sdk=Path(os.environ.get('ANDROID_SDK_ROOT') or os.environ['ANDROID_HOME']);bt=sdk/'build-tools/36.0.0'
key=Path(os.environ['RUNNER_TEMP'])/'mongyu-device-qa.jks'
subprocess.run(['keytool','-genkeypair','-keystore',str(key),'-alias','qa','-storepass','android','-keypass','android','-keyalg','RSA','-validity','2','-dname','CN=Disposable Device QA'],check=True)
manifest=root/'android/app/src/main/AndroidManifest.xml';original=manifest.read_text()
try:
 for version,name in [(90,'baseline'),(91,'updated')]:
  manifest.write_text(original.replace('versionCode="91"',f'versionCode="{version}"'))
  subprocess.run(['python3','android/build-unsigned.py'],cwd=root,check=True)
  unsigned=root/'android/outputs/MONGYU_R91_TEST_DEBUG_UNSIGNED.apk'
  subprocess.run([str(bt/'apksigner'),'sign','--ks',str(key),'--ks-key-alias','qa','--ks-pass','pass:android','--out',str(out/(name+'.apk')),str(unsigned)],check=True)
finally:manifest.write_text(original)
