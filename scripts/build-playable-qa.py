"""Build an actual R102 baseline and current R103 host with one disposable QA key."""
from pathlib import Path,PurePosixPath
import io,os,subprocess,tarfile,tempfile
root=Path(__file__).resolve().parents[1];out=root/'ci';out.mkdir(exist_ok=True)
sdk=Path(os.environ.get('ANDROID_SDK_ROOT') or os.environ['ANDROID_HOME']);bt=sdk/'build-tools/36.0.0';key=Path(os.environ['RUNNER_TEMP'])/'mongyu-r103-qa.jks'
subprocess.run(['keytool','-genkeypair','-keystore',str(key),'-alias','qa','-storepass','android','-keypass','android','-keyalg','RSA','-validity','2','-dname','CN=Disposable Device QA'],check=True)
def sign(src,dst):subprocess.run([str(bt/'apksigner'),'sign','--ks',str(key),'--ks-key-alias','qa','--ks-pass','pass:android','--out',str(dst),str(src)],check=True)
commit='8372e7cbd77b3d359f443bf2d53f2d28a73d942d'
data=subprocess.check_output(['git','archive',commit,'android','web','scripts/build-playable.py'],cwd=root)
with tempfile.TemporaryDirectory(prefix='mongyu-r102-baseline-') as folder:
 baseline=Path(folder)
 with tarfile.open(fileobj=io.BytesIO(data)) as archive:
  for member in archive.getmembers():
   path=PurePosixPath(member.name);assert not path.is_absolute() and '..' not in path.parts and not member.issym() and not member.islnk()
  archive.extractall(baseline)
 subprocess.run(['python3','scripts/build-playable.py'],cwd=baseline,check=True);subprocess.run(['python3','android/build-unsigned.py'],cwd=baseline,check=True)
 sign(baseline/'android/outputs/MONGYU_R102_TEST_DEBUG_UNSIGNED.apk',out/'baseline.apk')
subprocess.run(['python3','scripts/build-playable.py'],cwd=root,check=True);subprocess.run(['python3','android/build-unsigned.py'],cwd=root,check=True)
sign(root/'android/outputs/MONGYU_R103_TEST_DEBUG_UNSIGNED.apk',out/'updated.apk')
