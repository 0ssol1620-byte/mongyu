#!/usr/bin/env python3
"""Verify reviewed runtime hashes and exact web/Android asset parity."""
from pathlib import Path
import hashlib
import json

ROOT = Path(__file__).resolve().parents[1]
spec = json.loads((ROOT/'evidence/runtime-sha256.json').read_text(encoding='utf-8'))
for relative, expected in spec['sha256'].items():
    actual = hashlib.sha256((ROOT/relative).read_bytes()).hexdigest()
    if actual != expected:
        raise SystemExit('HASH MISMATCH: ' + relative)
assert (ROOT/'web/MONGYU_R31.html').read_bytes() == (ROOT/'android/app/src/main/assets/index.html').read_bytes()
print('PASS: reviewed runtime hashes and exact web/Android HTML parity')
