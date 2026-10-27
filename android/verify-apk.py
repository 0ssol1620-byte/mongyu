#!/usr/bin/env python3
"""Verify actual APK structure, manifest, DEX, alignment and signature state.

Static/compiled-artifact verification only; this does not install or run Android.
"""
import argparse
import os
import hashlib
import json
from pathlib import Path
import re
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parent
BT = Path(os.environ['ANDROID_SDK_ROOT']).resolve() / 'build-tools/36.0.0'
EXPECTED_HTML = 'a7fb4f597a6356ba6a42fe9bba75a42f565ea2ca9426a370652889216235f968'
parser = argparse.ArgumentParser()
parser.add_argument('--apk', type=Path, default=ROOT / 'outputs/MONGYU_R31_TEST_DEBUG_UNSIGNED.apk')
args = parser.parse_args()
apk = args.apk.resolve()
signed = False
prefix = 'unsigned'
logs = ROOT / 'logs'
logs.mkdir(exist_ok=True)
sha = lambda data: hashlib.sha256(data).hexdigest()

def run(name, *command, allow_failure=False):
    result = subprocess.run([str(x) for x in command], text=True, capture_output=True)
    output = result.stdout + result.stderr
    (logs / f'{prefix}-{name}.txt').write_text(output)
    if not allow_failure:
        assert result.returncode == 0, (name, output)
    return result.returncode, output

_, badging = run('badging', BT / 'aapt2', 'dump', 'badging', apk)
_, manifest = run('manifest', BT / 'aapt2', 'dump', 'xmltree', apk, '--file', 'AndroidManifest.xml')
_, permissions = run('permissions', BT / 'aapt2', 'dump', 'permissions', apk)
run('alignment', BT / 'zipalign', '-c', '-v', '-P', '16', '4', apk)
signature_status, signature = run('signature', BT / 'apksigner', 'verify', '--verbose', '--print-certs', apk, allow_failure=True)
assert "name='org.quadrift.mongyu.preview.r12'" in badging
assert "versionCode='7'" in badging and "versionName='0.31.0-preview-debug'" in badging
assert "minSdkVersion:'26'" in badging and "targetSdkVersion:'36'" in badging
assert "application-label:'몽유 테스트'" in badging
assert "name='org.quadrift.hddevelopment.MainActivity'" in badging
assert 'uses-permission:' not in permissions
assert re.search(r'allowBackup[^\n]*=false', manifest)
assert re.search(r'usesCleartextTraffic[^\n]*=false', manifest)
assert re.search(r'debuggable[^\n]*=true', manifest)
assert re.search(r'windowSoftInputMode[^\n]*=0x00000010', manifest)

with zipfile.ZipFile(apk) as archive:
    assert archive.testzip() is None
    entries = archive.namelist()
    assert len(entries) == len(set(entries)), 'Duplicate ZIP entries'
    expected_entries = {'AndroidManifest.xml', 'assets/index.html', 'classes.dex',
                        'res/drawable/ic_launcher.xml', 'resources.arsc'}
    assert {x for x in entries if not x.startswith('META-INF/')} == expected_entries
    embedded = archive.read('assets/index.html')
    assert sha(embedded) == EXPECTED_HTML
    assert embedded == (ROOT / 'app/src/main/assets/index.html').read_bytes()
    dex = logs / f'{prefix}-classes.dex'
    dex.write_bytes(archive.read('classes.dex'))
_, dex_text = run('dex-disassembly', BT / 'dexdump', '-d', dex)
assert 'addJavascriptInterface' not in dex_text and 'startActivity' not in dex_text
for method in ['setBlockNetworkLoads', 'setAllowFileAccess', 'setAllowContentAccess',
               'setMixedContentMode', 'setAllowFileAccessFromFileURLs',
               'setAllowUniversalAccessFromFileURLs', 'shouldOverrideUrlLoading']:
    assert method in dex_text
for inset in ['systemBars', 'displayCutout', 'ime']:
    assert f'Landroid/view/WindowInsets$Type;.{inset}:()I' in dex_text

def method_body(name):
    matches = re.findall(r"name\s+: '" + re.escape(name) + r"'([\s\S]*?)(?=\n\s+#\d+\s+:|\n\s+source_file_idx)", dex_text)
    assert len(matches) == 1, (name, len(matches))
    return matches[0]

pause = method_body('onPause')
resume = method_body('onResume')
back = method_body('gameBack')
destroy = method_body('onDestroy')
for token in ['QUAD_RIFT_APP.suspend()', 'evaluateJavascript', 'WebView;.onPause:', 'pauseTimers']:
    assert token in pause
assert pause.index('evaluateJavascript') < pause.index('pauseTimers')
assert 'resumeTimers' in resume and 'WebView;.onResume:' in resume
assert 'evaluateJavascript' not in resume and 'QUAD_RIFT_APP' not in resume
assert 'app.back(); app.suspend()' in back and 'moveTaskToBack' in back
assert 'WebView;.destroy:' in destroy

cert = None
assert signature_status != 0
assert 'DOES NOT VERIFY' in signature
assert not any(x.startswith('META-INF/') for x in entries)
assert b'APK Sig Block 42' not in apk.read_bytes()

result = {
    'apk': str(apk), 'bytes': apk.stat().st_size, 'apkSha256': sha(apk.read_bytes()),
    'embeddedHtmlBytes': len(embedded), 'embeddedHtmlSha256': sha(embedded),
    'embeddedHtmlByteIdenticalToReviewedR31': True,
    'applicationId': 'org.quadrift.mongyu.preview.r12', 'label': '몽유 테스트',
    'versionCode': 7, 'versionName': '0.31.0-preview-debug', 'minSdk': 26, 'targetSdk': 36,
    'debuggable': True, 'allowBackup': False, 'usesCleartextTraffic': False,
    'permissions': [], 'apkEntries': entries, 'onlyAssetIsReviewedHtml': True,
    'externalNativeLibrariesOrOriginalRomAssetsAdded': False,
    'zipIntegrityVerified': True, 'zipAlignmentVerified': True,
    'compiledLifecycleContractVerified': True, 'compiledImeInsetsAndAdjustResizeVerified': True,
    'signed': signed, 'certificateSha256': cert, 'signatureV2Verified': signed,
    'signatureFailureExpectedForUnsignedArtifact': not signed,
    'isUpdateToPriorR6Package': False, 'existingR6KeyRecovered': False,
    'deviceRuntimeVerified': False, 'deviceInstallOrUninstallPerformed': False,
    'existingSaveRetentionTested': False, 'physicalImeBehaviorTested': False,
    'playStorePublicationPerformed': False,
    'limitations': ['No Android device, emulator, or WebView runtime test',
                    'Same R12 applicationId; R16 source/signing lineage unavailable. Upgrade, coexistence and save retention are not device-tested',
                    'Static source/DEX assertions do not replace touch, sound, IME, or save testing on a device']
}
report = ROOT / f'R31_{prefix.upper()}_APK_VERIFICATION.json'
report.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(result, ensure_ascii=False, indent=2))
