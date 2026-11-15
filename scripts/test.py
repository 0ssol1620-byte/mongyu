"""Current original-file player checks. Historical clone suite: test-legacy-r92.py."""
from pathlib import Path
import subprocess,sys
root=Path(__file__).resolve().parents[1]
for command in [[sys.executable,'scripts/build-original.py'],['node','--test',*[str(p.relative_to(root)) for p in sorted((root/'tests/original').glob('*.test.mjs'))]]]:subprocess.run(command,cwd=root,check=True)
