#!/usr/bin/env python3
"""Portable focused checks, not the archived full regression aggregate."""
from pathlib import Path
import os
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
def run(args, **kwargs):
    print('+', ' '.join(args), flush=True)
    subprocess.run(args, cwd=ROOT, check=True, **kwargs)

run([sys.executable, 'scripts/test-build-portability.py'])
run([sys.executable, 'web/build.py'])
run([sys.executable, 'scripts/verify-snapshot.py'])
run(['node', '--test', *sorted(str(p.relative_to(ROOT)) for p in (ROOT/'web/tests').glob('*.test.cjs'))])
run(['node', '--test', 'web/tests/r31-day-night-ending.test.cjs'], env={**os.environ, 'AUDIT_INLINE':'1'})
run(['node', '--test', *sorted(str(p.relative_to(ROOT)) for p in (ROOT/'android/tests').glob('*.test.cjs'))])
