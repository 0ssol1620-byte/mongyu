#!/usr/bin/env python3
"""Build an unsigned Play test candidate from the pinned standalone payload."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile
from xml.etree import ElementTree as Xml
import zipfile


ROOT = Path(__file__).resolve().parent
MAIN = ROOT / 'app/src/main'
NS = 'http://schemas.android.com/apk/res/android'
AAPT2_SHA = 'c9f30b34c02fd48165251541125c3b7f21b98624e0f8341436fc65a84095e5d6'
BUNDLETOOL_SHA = 'a099cfa1543f55593bc2ed16a70a7c67fe54b1747bb7301f37fdfd6d91028e29'


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run(*args, capture=False):
    return subprocess.run([str(arg) for arg in args], check=True, text=True,
                          capture_output=capture).stdout


def build(args):
    # The pinned Maven binary is the Linux x86_64 bundle-capable AAPT2.
    if digest(args.aapt2) != AAPT2_SHA or digest(args.bundletool) != BUNDLETOOL_SHA:
        raise SystemExit('Use the pinned AAPT2 and bundletool versions from the Play readiness notes.')
    sdk = args.sdk.resolve()
    platform = sdk / 'platforms/android-36/android.jar'
    d8 = sdk / 'build-tools/36.0.0/d8'
    java = os.environ.get('JAVA', 'java')
    assets = MAIN / 'assets'
    expected = json.loads((ROOT / 'expected-playable-assets.json').read_text())
    html = assets / 'index.html'
    if expected['files'] != [{'path': 'index.html', 'bytes': html.stat().st_size, 'sha256': digest(html)}]:
        raise SystemExit('Regenerate the standalone R95 assets before building the bundle.')
    if [p for p in assets.rglob('*') if p.is_file()] != [html]:
        raise SystemExit('Unexpected packaged assets. Regenerate the standalone build.')

    Xml.register_namespace('android', NS)
    with tempfile.TemporaryDirectory(prefix='mongyu-store-') as folder:
        work = Path(folder)
        manifest = Xml.parse(MAIN / 'AndroidManifest.xml')
        app = manifest.getroot().find('application')
        app.set(f'{{{NS}}}debuggable', 'false')
        app.set(f'{{{NS}}}label', '몽유')
        manifest.write(work / 'AndroidManifest.xml', encoding='utf-8', xml_declaration=True)
        for name in ['generated', 'classes', 'dex']:
            (work / name).mkdir()
        run(args.aapt2, 'compile', '--dir', MAIN / 'res', '-o', work / 'resources.zip')
        run(args.aapt2, 'link', '--proto-format', '-I', platform, '--manifest', work / 'AndroidManifest.xml',
            '--java', work / 'generated', '-A', assets, '-o', work / 'resources.apk', work / 'resources.zip')

        # Use a separate compilation unit so a test APK's debug constant cannot reach the AAB.
        debug_config = work / 'BuildConfig.java'
        debug_config.write_text('package org.quadrift.hddevelopment;\n'
                                'public final class BuildConfig {\n'
                                '    public static final boolean DEBUG = false;\n'
                                '    private BuildConfig() {}\n}\n', encoding='utf-8')
        sources = sorted(p for p in (MAIN / 'java').rglob('*.java') if p.name != 'BuildConfig.java')
        run(java, '-m', 'jdk.compiler/com.sun.tools.javac.Main', '-source', '17', '-target', '17', '-g:none',
            '-encoding', 'UTF-8', '-classpath', platform, '-d', work / 'classes', debug_config, *sources)
        run(d8, '--release', '--min-api', '26', '--lib', platform, '--output', work / 'dex',
            *sorted((work / 'classes').rglob('*.class')))
        with zipfile.ZipFile(work / 'resources.apk') as resources, zipfile.ZipFile(work / 'base.zip', 'w', zipfile.ZIP_DEFLATED) as base:
            for name in sorted(resources.namelist()):
                if name.endswith('/'):
                    continue
                destination = 'manifest/AndroidManifest.xml' if name == 'AndroidManifest.xml' else name
                base.writestr(destination, resources.read(name))
            for dex in sorted((work / 'dex').glob('classes*.dex')):
                base.write(dex, 'dex/' + dex.name)
        bundle = work / 'mongyu.aab'
        tool = (java, '-jar', args.bundletool)
        run(*tool, 'build-bundle', f'--modules={work / "base.zip"}', f'--output={bundle}')
        run(*tool, 'validate', f'--bundle={bundle}')
        parsed = Xml.fromstring(run(*tool, 'dump', 'manifest', f'--bundle={bundle}', '--module=base', capture=True))
        packed_app = parsed.find('application')
        if packed_app.get(f'{{{NS}}}debuggable', 'false') != 'false':
            raise SystemExit('Bundle manifest is debuggable.')
        if parsed.findall('uses-permission'):
            raise SystemExit('Unexpected permissions in the offline build.')
        with zipfile.ZipFile(bundle) as zipped:
            if zipped.testzip() or zipped.read('base/assets/index.html') != html.read_bytes():
                raise SystemExit('Bundle does not contain the verified offline game.')
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_bytes(bundle.read_bytes())
    print(json.dumps({'bundle': str(args.output), 'sha256': digest(args.output),
                      'bytes': args.output.stat().st_size, 'package': parsed.get('package'),
                      'debuggable': False, 'signed': False, 'uploaded': False,
                      'assetSha256': digest(html)}, ensure_ascii=False))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--aapt2', type=Path, required=True)
    parser.add_argument('--bundletool', type=Path, required=True)
    parser.add_argument('--sdk', type=Path, default=os.environ.get('ANDROID_SDK_ROOT'), required='ANDROID_SDK_ROOT' not in os.environ)
    parser.add_argument('--output', type=Path, required=True)
    build(parser.parse_args())
