"""Verify a signed R91 preview artifact; does not install or run Android."""
from pathlib import Path
import argparse,hashlib,json,os,subprocess,zipfile
root=Path(__file__).resolve().parent
parser=argparse.ArgumentParser();parser.add_argument('apk',type=Path);args=parser.parse_args();apk=args.apk.resolve()
bt=Path(os.environ['ANDROID_SDK_ROOT'])/'build-tools/36.0.0'
def command(*argv):
 p=subprocess.run([str(a) for a in argv],check=True,capture_output=True,text=True);return p.stdout+p.stderr
signature=command(bt/'apksigner','verify','--verbose','--print-certs',apk)
assert 'Verified using v2 scheme (APK Signature Scheme v2): true' in signature
command(bt/'zipalign','-c','-P','16','4',apk)
badging=command(bt/'aapt2','dump','badging',apk)
for token in ["name='org.quadrift.mongyu.preview.r82'","versionCode='91'","versionName='0.91.0-preview'","minSdkVersion:'26'","targetSdkVersion:'36'","application-label:'몽유 R91 테스트'","name='org.quadrift.hddevelopment.MainActivity'"]:
 assert token in badging,token
permissions=command(bt/'aapt2','dump','permissions',apk);assert 'uses-permission:' not in permissions
with zipfile.ZipFile(apk) as z:
 assert z.testzip() is None;names=z.namelist();assert len(names)==len(set(names));assert 'classes.dex' in names
 embedded=z.read('assets/index.html');assert embedded==(root/'../web/MONGYU_R91.html').read_bytes();assert embedded==(root/'app/src/main/assets/index.html').read_bytes()
 assert hashlib.sha256(embedded).hexdigest()==(root/'expected-asset.sha256').read_text().strip()
 assert b'Lorg/quadrift/hddevelopment/MainActivity;' in z.read('classes.dex')
 assert not any(n.startswith('lib/') for n in names)
report={'release':'R91','apk':apk.name,'bytes':apk.stat().st_size,'sha256':hashlib.sha256(apk.read_bytes()).hexdigest(),'applicationId':'org.quadrift.mongyu.preview.r82','label':'몽유 R91 테스트','versionCode':91,'versionName':'0.91.0-preview','minAndroid':'8.0 (API 26)','targetSdk':36,'signed':True,'signatureVerification':signature,'zipAlignmentVerified':True,'zipIntegrityVerified':True,'permissions':[],'embeddedHtmlSha256':hashlib.sha256(embedded).hexdigest(),'embeddedHtmlMatchesFinalR91':True,'deviceInstalledOrPlayed':False,'storeRelease':False}
(root/'../evidence/r91-signed-apk.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='signatureVerification'},ensure_ascii=False,indent=2))
