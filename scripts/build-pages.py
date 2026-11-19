"""Stage the exact standalone game for a static HTTPS host."""
import argparse
from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]

parser = argparse.ArgumentParser()
parser.add_argument('destination', type=Path)
args = parser.parse_args()
out = args.destination.resolve()
out.mkdir(parents=True, exist_ok=True)

subprocess.run([sys.executable, 'scripts/build-playable.py'], cwd=ROOT, check=True)
shutil.copyfile(ROOT / 'web/MONGYU_R102.html', out / 'index.html')
(out / '.nojekyll').touch()
