# GitHub에 올리기 전 준비

이 문서는 업로드와 이후 배포 점검 순서입니다. 최초 게시 대상은 `ideapt/project-factory`, 공개 저장소이며 자체 자료에는 MIT 라이선스를 적용합니다. 웹 서비스 배포는 별도입니다.

## 준비된 것

- 첫 화면 README와 설치부터 워드·PDF까지 이어지는 사용자 안내
- 63개 양식, 가상 작성본 JSON, 파일 읽기·OCR 연습 자료, 실제 다운로드 예시
- 기능 한도·미확인 규칙·백업·문제 해결 안내
- 개발 설치·검사·공개 ZIP 생성 방법
- 외부 도구·글꼴·OCR 모델 고지
- push·PR 시 검사하는 GitHub Actions 설정. 실제 GitHub 실행 결과는 업로드 후 확인해야 합니다.
- 공개용 압축 및 경로·크기·SHA-256 목록. 개인 폴더·node_modules·내부 계획·Word 화면 캡처 제외

## 저장소 설정

- 소유 계정: ideapt
- 이름: project-factory
- 공개 범위: 공개
- 자체 코드·문서·양식: MIT. 저작권 표시는 `Copyright (c) 2026 ideapt`입니다.
- 외부 배포물: THIRD_PARTY_NOTICES와 포함된 개별 고지 유지.

## 공개 패키지 만들기

```sh
python scripts/package-public.py
```

`dist/project-factory-public.zip`은 일반 사용자도 사용할 수 있는 앱과 문서 전체를 포함합니다. `dist/public-manifest.json`에는 포함 파일과 검사할 해시를 기록합니다. ZIP을 풀어 최상위 `project-factory` 폴더 안의 내용을 저장소 루트에 올립니다. ZIP 한 개만 코드 저장소에 올리면 README·코드 탐색이 되지 않습니다.

브라우저 QA 기록에는 가상 예시만 포함합니다. 계정 정보가 보일 수 있는 Word 화면 캡처와 내부 작업 계획은 배포 압축에서 제외합니다. 공개 전에 manifest의 파일 목록을 확인하세요. 이 목록은 사람이 검토할 범위를 줄여 주며 모든 민감정보를 자동 판별하지는 않습니다.

## 처음 저장소에 올리는 순서

1. GitHub에서 소유 계정 아래 새 저장소를 만들고 공개/비공개를 정합니다.
2. 이미 README가 있으므로 저장소 초기 파일을 중복 생성하지 않습니다.
3. ZIP을 푼 공개 폴더를 GitHub Desktop으로 추가하거나 Git으로 업로드합니다. 원래 작업 폴더 전체를 무작정 올리지 않습니다.
4. README 링크, 가상 예시 JSON, 외부 도구·글꼴 파일이 모두 올라왔는지 확인합니다.
5. Actions에서 검사가 성공했는지 확인합니다.
6. 라이선스·공개 범위가 확정되면 릴리스를 만들고 공개용 ZIP과 manifest를 첨부합니다. 일반 사용자는 릴리스 ZIP을 받고, 개발자는 코드 저장소를 복제할 수 있습니다.

Git에 익숙하다면 공개 폴더에서 다음 순서로 진행합니다. 마지막 원격 주소는 직접 만든 저장소의 실제 주소를 사용합니다.

```sh
git init
git add .
git commit -m "Prepare project factory planning workspace"
git branch -M main
```

그 뒤 `git remote add origin`과 실제 저장소 주소를 입력하고 `git push -u origin main`을 실행합니다. 최초 게시에서는 위와 같은 절차로 공개 파일을 main 브랜치에 업로드했습니다. 저장소: https://github.com/ideapt/project-factory

## 배포 전 확인

- [x] 자체 자료의 라이선스와 저작권 주체를 정했다.
- [x] 공개할 계정·저장소 이름·공개 범위를 정했다.
- [ ] 공개 ZIP의 파일 목록에 비공개 자료가 없음을 확인했다.
- [ ] 포함된 외부 도구·글꼴 고지와 라이선스를 유지했다.
- [ ] 새 폴더에서 앱을 실행하고 예시 JSON으로 문서 다운로드를 확인했다.
- [ ] 업로드 후 Actions 검사 결과와 README 링크를 확인했다.

GitHub Pages 주소는 https://ideapt.github.io/project-factory/ 입니다. main 브랜치 변경은 자동 검사 후 앱 파일만 dist/site에 모아 배포합니다. 비공개 작업 폴더·사용자 원자료를 배포 디렉터리에 넣지 않습니다.
