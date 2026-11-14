"""Portable R80 distribution checks; no device or store certification implied."""
from pathlib import Path
import subprocess,sys
root=Path(__file__).resolve().parents[1]
for command in [[sys.executable,'web/build.py'],[sys.executable,'scripts/verify-snapshot.py'],['node','--test',*[str(p.relative_to(root)) for p in sorted((root/'web/tests').glob('*.test.cjs'))]]]:
 subprocess.run(command,cwd=root,check=True)
