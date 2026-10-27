#!/usr/bin/env python3
"""Build this project's independent debug-only APK with official SDK tools.

No signing key is generated, read, or used by this script. No device commands.
The SDK and JDK must already be installed; no signing or installation is performed.
"""
import hashlib
import os
from pathlib import Path
import shutil
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / 'app/src/main/assets/index.html'
MAIN = ROOT / 'app/src/main'
SDK = Path(os.environ['ANDROID_SDK_ROOT']).resolve()
BT = SDK / 'build-tools/36.0.0'
ANDROID = SDK / 'platforms/android-36/android.jar'
BUILD = ROOT / 'build'
OUTPUT = ROOT / 'outputs/MONGYU_R31_TEST_DEBUG_UNSIGNED.apk'
EXPECTED = 'a7fb4f597a6356ba6a42fe9bba75a42f565ea2ca9426a370652889216235f968'

def run(*args):
    args = [str(a) for a in args]
    print('+', ' '.join(args), flush=True)
    subprocess.run(args, check=True, cwd=ROOT)

assert hashlib.sha256(SOURCE.read_bytes()).hexdigest() == EXPECTED
assert (MAIN / 'assets/index.html').read_bytes() == SOURCE.read_bytes()
assert (ROOT / 'expected-asset.sha256').read_text(encoding='utf-8').strip() == EXPECTED
if BUILD.exists():
    shutil.rmtree(BUILD)
for name in ['classes', 'dex', 'generated']:
    (BUILD / name).mkdir(parents=True)
OUTPUT.parent.mkdir(exist_ok=True)

run(BT / 'aapt2', 'compile', '--dir', MAIN / 'res', '-o', BUILD / 'resources.zip')
run(BT / 'aapt2', 'link', '-o', BUILD / 'resources.apk', '-I', ANDROID,
    '--manifest', MAIN / 'AndroidManifest.xml', '--java', BUILD / 'generated',
    '--min-sdk-version', '26', '--target-sdk-version', '36', '--debug-mode',
    '-A', MAIN / 'assets', BUILD / 'resources.zip')
java_sources = sorted((MAIN / 'java').rglob('*.java'))
# The installed OpenJDK includes jdk.compiler even though javac is not on PATH.
run(os.environ.get('JAVA', 'java'), '-m', 'jdk.compiler/com.sun.tools.javac.Main',
    '-source', '17', '-target', '17', '-g', '-encoding', 'UTF-8', '-classpath', ANDROID,
    '-d', BUILD / 'classes', *java_sources)
run(BT / 'd8', '--debug', '--min-api', '26', '--lib', ANDROID,
    '--output', BUILD / 'dex', *sorted((BUILD / 'classes').rglob('*.class')))

# Canonical ZIP metadata makes repeated builds comparable before zipalignment.
with zipfile.ZipFile(BUILD / 'resources.apk') as source_zip:
    entries = [(i.filename, source_zip.read(i), i.compress_type)
               for i in source_zip.infolist() if not i.is_dir()]
entries += [(p.name, p.read_bytes(), zipfile.ZIP_STORED)
            for p in sorted((BUILD / 'dex').glob('classes*.dex'))]
with zipfile.ZipFile(BUILD / 'unaligned.apk', 'w') as dest:
    for name, data, method in sorted(entries):
        item = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
        item.compress_type = method
        item.create_system = 3
        item.external_attr = 0o100644 << 16
        dest.writestr(item, data, compresslevel=9)
run(BT / 'zipalign', '-f', '-P', '16', '4', BUILD / 'unaligned.apk', OUTPUT)
run(BT / 'zipalign', '-c', '-P', '16', '4', OUTPUT)
print('UNSIGNED APK:', OUTPUT)
print('bytes:', OUTPUT.stat().st_size)
print('SHA-256:', hashlib.sha256(OUTPUT.read_bytes()).hexdigest())
