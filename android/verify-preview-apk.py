"""Verify the R98 standalone game, stable certificate and exact playable payload."""
from pathlib import Path
import argparse,hashlib,json,os,subprocess,zipfile
root=Path(__file__).resolve().parent;parser=argparse.ArgumentParser();parser.add_argument('apk',type=Path);args=parser.parse_args();apk=args.apk.resolve();bt=Path(os.environ['ANDROID_SDK_ROOT'])/'build-tools/36.0.0'
def command(*argv):
 p=subprocess.run([str(a) for a in argv],check=True,capture_output=True,text=True);return p.stdout+p.stderr
signature=command(bt/'apksigner','verify','--verbose','--print-certs',apk);assert 'Verified using v2 scheme (APK Signature Scheme v2): true' in signature
assert '77897ae16ffcedcc3ebb530486065b8533fbeace11b92193795d1430035b4c8f' in signature
command(bt/'zipalign','-c','-P','16','4',apk);badging=command(bt/'aapt2','dump','badging',apk)
for token in ["name='org.quadrift.mongyu.preview.r82'","versionCode='98'","versionName='0.98.0-preview'","minSdkVersion:'26'","targetSdkVersion:'36'","application-label:'몽유 R98'","name='org.quadrift.hddevelopment.MainActivity'"]:assert token in badging,token
permissions=command(bt/'aapt2','dump','permissions',apk);assert 'uses-permission:' not in permissions
manifest=json.loads((root/'expected-playable-assets.json').read_text())
with zipfile.ZipFile(apk) as z:
 assert z.testzip() is None;assert len(z.namelist())==len(set(z.namelist()));assert 'classes.dex' in z.namelist()
 assets={n[7:] for n in z.namelist() if n.startswith('assets/') and not n.endswith('/')};assert assets=={r['path'] for r in manifest['files']}
 for item in manifest['files']:
  data=z.read('assets/'+item['path']);assert len(data)==item['bytes'] and hashlib.sha256(data).hexdigest()==item['sha256'];assert data==(root/'../web/MONGYU_R98.html').read_bytes()
 assert not any(Path(n).suffix.lower() in {'.jar','.zip','.bin','.pzx','.mmf','.mp3','.sf3'} for n in assets)
 html=z.read('assets/index.html');assert all(t not in html for t in [b'chooseOriginal',b'fileInput',b'MongyuOriginal',b'wie_web_bg.wasm']);assert all(token in html for token in [b'id="titleContinue"',b'QUAD_RIFT_APP',b'MONGYU_EMBEDDED_EFFECTS',b'"opening-ceiling"'])
 assert not any(n.startswith('lib/') for n in z.namelist())
report={'release':'R98','apk':apk.name,'bytes':apk.stat().st_size,'sha256':hashlib.sha256(apk.read_bytes()).hexdigest(),'applicationId':'org.quadrift.mongyu.preview.r82','versionCode':98,'minAndroid':'8.0 (API 26)','targetSdk':36,'signed':True,'signatureVerification':signature,'zipAlignmentVerified':True,'zipIntegrityVerified':True,'permissions':[],'commercialOriginalPayloadIncluded':False,'requiresUserOriginalFile':False,'assets':manifest['files'],'finalSignedDirectDeviceInstall':False,'storeRelease':False}
(root/'../evidence/r98-signed-apk.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if k not in ['signatureVerification','assets']},ensure_ascii=False))
