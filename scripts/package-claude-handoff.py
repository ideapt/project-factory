"""Package explicit handoff documents and verify their hashes; never include app secrets."""
from pathlib import Path
import argparse
import hashlib
import json
import re
import subprocess
import zipfile


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--date', required=True, help='Document revision date, YYYY-MM-DD')
    args = parser.parse_args()
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', args.date):
        parser.error('Use YYYY-MM-DD')
    root = Path(__file__).resolve().parents[1]
    files = sorted(p for p in (root / 'docs/claude-handoff').rglob('*') if p.is_file())
    extra = ['README.md', 'CHANGELOG.md', 'LICENSE', 'THIRD_PARTY_NOTICES.md',
             'docs/draft-writing-style.md', 'docs/usage-and-feedback.md', 'docs/development.md',
             'docs/standard.md', 'docs/document-export.md', 'docs/files-v06.md', 'docs/ocr-v07.md',
             'examples/material-draft-demo.json', 'examples/draft-style-before.md',
             'examples/draft-style-after.md', 'scripts/package-claude-handoff.py']
    files += [root / name for name in extra]
    assert all(p.is_file() for p in files), 'Missing handoff dependency'
    try:
        source_ref = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root,
                                             stderr=subprocess.DEVNULL, text=True).strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        source_ref = None
    manifest = {'revision_date': args.date, 'repository': 'https://github.com/ideapt/project-factory',
                'prepared_from_commit': source_ref,
                'note': 'prepared_from_commit is the pre-package checkout, not the archive commit',
                'implementation_baseline': '35cc6189cd0946f4171a3572e81e23c863cce607',
                'source_code_included': False, 'upgrade_implemented': False,
                'requested_scope': 'implementation, verification, public deployment', 'files': []}
    for p in sorted(files):
        data = p.read_bytes()
        manifest['files'].append({'path': p.relative_to(root).as_posix(), 'bytes': len(data),
                                  'sha256': hashlib.sha256(data).hexdigest()})
    intro = ("프로젝트 공장 Claude 전달 자료 / 개정일: " + args.date + "\n\n"
             "1. 이 ZIP을 Claude에 첨부.\n"
             "2. docs/claude-handoff/06-claude-instructions.md 본문을 전달.\n"
             "3. https://github.com/ideapt/project-factory 의 최신 소스로 구현.\n\n"
             "작업 범위: 공통 10개 항목·대안/실행/위험 입력표 구현 → 검증 → 기존 공개 사이트 배포.\n"
             "사이트 업그레이드는 아직 구현 전. 이 ZIP은 문서·가상 예시만 포함하며 앱 소스는 미포함.\n"
             "프로젝트 공장 자체 사업 예시는 형식 참고용. 사용자 기획서에 고정 삽입 금지.\n"
             "이전 개정본 대신 이 ZIP과 지시문을 사용.\n")
    output = root / 'downloads'
    output.mkdir(exist_ok=True)
    stem = 'project-factory-claude-handoff-' + args.date
    archive = output / (stem + '.zip')
    with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
        for p in files:
            z.write(p, p.relative_to(root).as_posix())
        z.writestr('START_HERE.txt', intro)
        z.writestr('MANIFEST.json', json.dumps(manifest, ensure_ascii=False, indent=2))
    with zipfile.ZipFile(archive) as z:
        assert z.testzip() is None, 'ZIP corruption'
        for f in manifest['files']:
            assert hashlib.sha256(z.read(f['path'])).hexdigest() == f['sha256'], f['path']
        json.loads(z.read('docs/claude-handoff/examples/planning-extension.json'))
        instructions = z.read('docs/claude-handoff/06-claude-instructions.md').decode('utf-8')
        assert '## 8. 공개 배포' in instructions and '공개 배포까지 진행해줘' in instructions
        assert '이번 요청은 개발·검증까지.' not in instructions
        assert not any('/.git/' in n or '/node_modules/' in n or Path(n).name.startswith('.env')
                       for n in z.namelist()), 'Unapproved package content'
    sidecar = dict(manifest)
    sidecar['archive'] = {'path': archive.name, 'bytes': archive.stat().st_size,
                         'sha256': hashlib.sha256(archive.read_bytes()).hexdigest()}
    (output / (stem + '.manifest.json')).write_text(
        json.dumps(sidecar, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'archive': str(archive), 'entries': len(files) + 2,
                      'bytes': archive.stat().st_size, 'integrity': 'passed'}, ensure_ascii=False))


if __name__ == '__main__':
    main()
