"""Build a reviewable GitHub source/user package without private working files."""
from pathlib import Path
import hashlib
import json
import zipfile

root = Path(__file__).resolve().parent.parent
out = root / 'dist'
out.mkdir(exist_ok=True)
top = {'README.md', 'CHANGELOG.md', 'CONTRIBUTING.md', 'SOURCES.md',
       'THIRD_PARTY_NOTICES.md', '.gitignore', '.gitattributes', 'package.json', 'package-lock.json',
       '로컬 실행.cmd', 'LICENSE', 'LICENSE.md'}
folders = {'prototype', 'templates', 'examples', 'docs', 'scripts', '.github', 'services'}
excluded = {'node_modules', '.git', 'private', 'raw-private', 'dist', '__pycache__', '.sites-runtime', '.wrangler', 'outputs'}
files = []
for item in sorted(root.rglob('*')):
    if not item.is_file():
        continue
    rel = item.relative_to(root)
    if any(part in excluded for part in rel.parts):
        continue
    if len(rel.parts) == 1 and rel.name not in top:
        continue
    if len(rel.parts) > 1 and rel.parts[0] not in folders:
        continue
    if 'superpowers' in rel.parts or rel.name.startswith(('.env', '~$')):
        continue
    if rel.name.startswith('word-') and rel.suffix == '.png':
        continue
    if rel.suffix in {'.tmp', '.pyc'} or rel.name in {'Thumbs.db', '.DS_Store'}:
        continue
    files.append((item, rel.as_posix()))

manifest = {'status': 'prepared-not-published', 'license': 'selected' if any((root / x).exists() for x in ['LICENSE', 'LICENSE.md']) else 'pending-owner-selection',
            'files': [{'path': name, 'bytes': p.stat().st_size,
                       'sha256': hashlib.sha256(p.read_bytes()).hexdigest()} for p, name in files]}
archive = out / 'project-factory-public.zip'
with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED) as z:
    for item, name in files:
        z.write(item, 'project-factory/' + name)
manifest['archiveBytes'] = archive.stat().st_size
manifest['archiveSha256'] = hashlib.sha256(archive.read_bytes()).hexdigest()
(out / 'public-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'Public package: {len(files)} files, {archive.stat().st_size} bytes; license={manifest["license"]}')
