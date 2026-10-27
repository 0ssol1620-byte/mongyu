#!/usr/bin/env python3
"""Guard UTF-8 reads and binary LF output, including CRLF input fixtures.

A portable regression simulation, not a substitute for an actual Windows run.
"""
from pathlib import Path
import hashlib
import runpy
import shutil
import tempfile
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
EXPECTED = 'a7fb4f597a6356ba6a42fe9bba75a42f565ea2ca9426a370652889216235f968'
read_text = Path.read_text

def explicit_utf8(path, *args, **kwargs):
    if kwargs.get('encoding') != 'utf-8':
        raise AssertionError('Build text reads must explicitly use UTF-8')
    return read_text(path, *args, **kwargs)

def reject_text_output(*args, **kwargs):
    raise AssertionError('Build output must use write_bytes to prevent platform newline translation')

with tempfile.TemporaryDirectory(prefix='mongyu-portability-') as directory:
    web = Path(directory)/'web'
    shutil.copytree(ROOT/'web', web)
    for line_ending in (b'\n', b'\r\n'):
        for relative in ['index.template.html', 'assets/r10/manifest.json',
                         *[str(p.relative_to(web)) for p in (web/'src').glob('*.js')]]:
            path = web/relative
            path.write_bytes(path.read_bytes().replace(b'\r\n', b'\n').replace(b'\n', line_ending))
        with patch.object(Path, 'read_text', explicit_utf8), patch.object(Path, 'write_text', reject_text_output):
            runpy.run_path(str(web/'build.py'), run_name='__main__')
        output = (web/'MONGYU_R31.html').read_bytes()
        assert b'\r\n' not in output
        assert hashlib.sha256(output).hexdigest() == EXPECTED

attributes = (ROOT/'.gitattributes').read_text(encoding='utf-8')
assert '* text=auto eol=lf' in attributes and '*.webp binary' in attributes
print('PASS: explicit UTF-8 input, binary LF output, LF/CRLF fixtures and Git attributes')
