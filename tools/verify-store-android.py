#!/usr/bin/env python3
"""Smoke test the bundle-derived APK through the Android accessibility tree."""
from pathlib import Path
import json
import re
import subprocess
import sys
import time
from xml.etree import ElementTree as Xml


PACKAGE = 'org.quadrift.mongyu.preview.r82'
DEVICE_TREE = '/sdcard/mongyu-store-qa.xml'
OUTPUT = Path('ci/store-device')


def adb(*args, check=True):
    return subprocess.run(['adb', *args], capture_output=True, text=True,
                          check=check, timeout=40).stdout.strip()


def wait_for_label(label, *, tap=False):
    deadline = time.monotonic() + 60
    found_labels = []
    while time.monotonic() < deadline:
        dump = adb('shell', 'uiautomator', 'dump', DEVICE_TREE, check=False)
        if 'dumped' not in dump:
            time.sleep(0.3)
            continue
        tree = Xml.fromstring(adb('shell', 'cat', DEVICE_TREE))
        nodes = list(tree.iter('node'))
        found_labels = [value for node in nodes for value in (node.get('text'), node.get('content-desc')) if value]
        if "Quickstep isn't responding" in found_labels:
            press(next(node for node in nodes if node.get('text') == 'Close app'))
            time.sleep(0.8)
            continue
        matched = next((node for node in nodes if node.get('package') == PACKAGE
                        and label in (node.get('text'), node.get('content-desc'))), None)
        if matched is not None:
            if tap:
                press(matched)
            return
        time.sleep(0.3)
    raise RuntimeError(f'Accessibility label {label!r} missing. Visible labels: {found_labels}')


def press(node):
    x1, y1, x2, y2 = map(int, re.findall(r'\d+', node.get('bounds')))
    adb('shell', 'input', 'tap', str((x1+x2)//2), str((y1+y2)//2))


def main(apk):
    OUTPUT.mkdir(parents=True, exist_ok=True)
    adb('shell', 'settings', 'put', 'secure', 'immersive_mode_confirmations', 'confirmed')
    adb('install', '--no-incremental', '-r', apk)
    adb('shell', 'am', 'start', '-W', '-n', PACKAGE + '/org.quadrift.hddevelopment.MainActivity')
    wait_for_label('꿈속으로', tap=True)
    wait_for_label('계속', tap=True)
    wait_for_label('첫 달리기 시작', tap=True)
    wait_for_label('일시정지 · 메뉴')
    pid = adb('shell', 'pidof', PACKAGE)
    sockets = adb('shell', 'cat', '/proc/net/unix')
    if not pid or 'webview_devtools_remote_' + pid in sockets:
        raise RuntimeError('The game process is missing or exposes a debugger.')
    with (OUTPUT / 'first-run.png').open('wb') as screenshot:
        subprocess.run(['adb', 'exec-out', 'screencap', '-p'], stdout=screenshot, check=True, timeout=20)
    report = {'package': PACKAGE, 'source': 'bundle-derived APK with temporary QA key',
              'testedLabels': ['꿈속으로', '계속', '첫 달리기 시작', '일시정지 · 메뉴'],
              'androidApi': int(adb('shell', 'getprop', 'ro.build.version.sdk')),
              'webViewDebugSocket': False, 'physicalDevice': False, 'passed': True}
    (OUTPUT / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
    print(json.dumps(report, ensure_ascii=False))


if __name__ == '__main__':
    main(sys.argv[1])
