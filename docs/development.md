# 개발과 검사

## 실행 환경

일반 사용자 실행에는 Node.js가 필요하지 않습니다. 개발·검사는 Node.js 24와 Python 3.12에서 확인했습니다. PDF.js 의존성이 요구하는 Node.js 범위는 `>=22.13.0 || >=24`입니다. 고정된 버전은 `package-lock.json`에 있습니다.

```sh
npm ci
npm run check
```

설치 시 패키지 다운로드를 위한 인터넷이 필요합니다. 앱의 로컬 사용과 OCR·문서 생성은 포함된 도구로 처리합니다. `npm run check`는 테스트 결과·가상 문서를 생성하므로 작업 파일이 생길 수 있습니다.

## 주요 파일

| 위치 | 역할 |
|---|---|
| prototype/index.html, style.css, app.js | 화면·입력·저장·다운로드 연결 |
| prototype/catalog.js, catalog-v04.js | 분류·유형·질문·지표·추천 조합 |
| prototype/draft-engine.js | 필요 데이터 안내·근거 상태·초안 구성 |
| prototype/file-reader.js, ocr-reader.js | 파일 추출·원문 추적·OCR |
| prototype/document-export.js | 같은 초안을 DOCX·PDF로 변환 |
| prototype/vendor | 배포용 도구·모델·글꼴·고지 |
| templates, examples, docs | 양식·가상 예시·사용 안내 |
| scripts | 도구 빌드·검사·공개 패키지 생성 |

## 수정 후 확인

```sh
npm run check
```

분류·이전 작성본 복원·초안·파일 추출·한국어 OCR·수치/미확인 보존·문서 생성 검사를 실행합니다. 브라우저 다운로드 검사는 별도로 실제 버튼을 눌러 확인해야 합니다. 보관한 다운로드 파일의 재검사는 `node scripts/check-browser-download.cjs`입니다. 상세 결과는 [실제 다운로드 점검](verification-document-export.md)에 있습니다.

기획 유형을 바꾸면 `node scripts/export-templates.cjs`로 양식을 갱신합니다. 기존 질문 문자열은 작성본의 답변 키이므로 바꾸려면 이전 데이터 이동도 함께 설계해야 합니다.

배포용 라이브러리를 다시 만들려면 다음을 실행합니다. 글꼴 원본과 고지 파일은 `prototype/vendor/export/`에 있어야 합니다.

```sh
npm run build:vendor
npm run build:export
```

OCR 모델·글꼴을 포함하므로 저장소 크기는 작지 않습니다. 일반 사용자에게 `node_modules`를 전달하지 않습니다. [배포 고지](../THIRD_PARTY_NOTICES.md)와 번들의 라이선스 주석을 유지하세요.

## 공개용 압축 만들기

```sh
python scripts/package-public.py
```

`dist/project-factory-public.zip`과 파일 목록·크기·SHA-256을 기록한 manifest가 생깁니다. Windows 런처·전체 앱·문서·양식·가상 예시·개발 스크립트를 포함하고 개인 자료·설치 폴더·Word 화면 캡처·내부 작업 계획을 제외합니다. 기존 파일을 삭제하지 않습니다.

현재 자동 검사는 Windows에서 수행했으며 다른 운영체제의 실제 UI는 별도로 검증해야 합니다. 소유자가 정할 라이선스는 공개 단계의 남은 항목입니다. [새 폴더 설치·패키지 검사 결과](verification-public-package.md)를 참고하세요.
