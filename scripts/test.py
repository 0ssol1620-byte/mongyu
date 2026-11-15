"""Validate the standalone game and stage the playable Android payload."""
from pathlib import Path
import subprocess,sys
root=Path(__file__).resolve().parents[1]
for script in ['scripts/test-legacy-r92.py','scripts/build-playable.py']:
 subprocess.run([sys.executable,script],cwd=root,check=True)
