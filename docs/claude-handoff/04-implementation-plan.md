# 기획서 생성 기능 구현 계획

**Goal:** 기존 입력·파일 처리·통계를 유지하고 10개 항목 초안과 동일 내용의 문서를 생성한다.

**Architecture:** 규칙 기반 계획 모델을 한 번 구성하고 화면·Markdown·DOCX·PDF가 같은 모델을 사용한다. 기존 `generate(C,state)`는 문자열 반환 호환 래퍼로 유지한다. 원문은 구조화된 텍스트로 보존하며 원문 속 Markdown이나 지시문을 문서 구조·명령으로 실행하지 않는다.

**Tech Stack:** 기존 브라우저 JavaScript·HTML·CSS, fflate·pdfmake, Node.js 24 검사.

**Spec:** [제품 요구사항](02-upgrade-requirements.md)

## 공통 제약

- 외부 AI·새 인증·새 서버·결제 기능 추가 없음.
- 기존 파일·OCR·근거·통계 기능 유지.
- 저장 키 `project-factory-planning-v03` 유지.
- 버전 상승 시 0.3~0.7 복원 명시 유지.
- 단계별 검사·의미 있는 커밋. 최종 배포는 검증 완료 상태와 구분해 보고.

## 우선 검토할 실패 조건

- 구버전 복원 시 새 구조 기본값 때문에 기존 답변·근거가 사라짐.
- 여러 분야를 합칠 때 공통 항목·효과가 중복 생성됨.
- OCR·가상 자료가 실제 근거로 승격됨.
- 문서 표에서 긴 원문·줄바꿈·기호·음수·소수점이 잘림.
- 화면·다운로드가 서로 다른 입력 시점의 초안을 사용함.

## 권장 인터페이스

새 설계이며 현재 구현된 함수가 아님. 동등한 설계로 바꾸면 근거와 호환 방식을 기록.

- `PlanningDraft.buildPlan(C,state) -> PlanDocument`
- `PlanningDraft.toMarkdown(plan) -> string`
- `PlanningDraft.generate(C,state) -> string`: 위 두 함수를 호출하는 호환 래퍼.
- `PlanningExport.fromPlan(plan) -> ExportModel`: 같은 PlanDocument를 기존 문서 모델로 변환.
- 기존 `PlanningExport.model(markdown)`는 외부 호환·기존 검사에 남김.

`PlanDocument` 권장 구조:

```text
{ title, version, sections:[
  { id, title, blocks:[
    { kind:'text', text, provenance, referenceIds },
    { kind:'list', items:[{text, provenance, referenceIds}] },
    { kind:'table', columns:[...], rows:[[Cell,...],...] }
  ] }
] }
Cell = { text, provenance, referenceIds }
provenance = 'input' | 'source' | 'assumption' | 'calculated' | 'proposal' | 'unknown'
```

- provenance는 표기 분류이며 사실 인증 등급이 아님.
- 셀의 원문·줄바꿈을 유지. Markdown 표에서만 표시용 escape 처리.
- 문서 출력은 Markdown 재해석 대신 `fromPlan`의 실제 표 블록 사용.
- 현재 exporter는 연속된 `- 항목: 값`을 2열 표로 바꾸는 방식. 일반 다열 Markdown 표를 지원한다고 가정하지 말 것.

## 단계 1 상태·입력 확장

- 수정: `prototype/app.js`, `index.html`, `style.css`, 필요 시 `catalog.js` 버전.
- 추가 권장: `state.planning`의 meta·alternatives·actions·risks·financials.
- 구체 구조: [가상 입력 명세](examples/README.md).
- [ ] 구버전 JSON 복원·재백업 왕복 검사 먼저 추가.
- [ ] 새 속성 기본값·타입·허용 필드 정규화 구현.
- [ ] 행 추가·수정·삭제, 접기/펼치기, 저장·복원 연결.
- [ ] 기존 질문 키·근거 ID·선택 해제 후 자료 보관 검사.
- [ ] 입력 변경 시 초안 갱신 안내 확인 후 커밋.

## 단계 2 공통 계획 모델·생성

- 수정: `prototype/draft-engine.js`.
- 분리 권장: `prototype/planning-model.js`; 실제 추가 시 HTML 로드 순서·build-web 복사 목록·Node 검사 require 경로 갱신.
- [ ] 단일·통합·빈 자료의 10개 항목 순서 검사 작성.
- [ ] 기존 common·answers·materials·traces를 새 모델로 손실 없이 배치.
- [ ] 수집표·대안표·실행표·위험표·근거표 생성.
- [ ] 상태 분류·출처 위치·미확인 목록·최대 3개 질문 구현.
- [ ] 가상·추정·원문 미검토·단위 차이·중복 질문 검사.
- [ ] 원본 state 무변경·동일 입력 동일 출력 확인 후 커밋.

## 단계 3 화면·문서 출력 일치

- 수정: `prototype/app.js`, `document-export.js`, 필요 시 `style.css`.
- [ ] 같은 PlanDocument로 미리보기·Markdown·Word·PDF 생성하도록 연결.
- [ ] 새 표를 실제 DOCX/PDF 표로 변환. 머리글·열·긴 행·페이지 분할 점검.
- [ ] 목차·북마크·출처·해시·OCR 점수·페이지 번호 유지.
- [ ] 원문 기호 `|`, 줄바꿈, URL, HTML, Markdown 제목을 내용으로 보존.
- [ ] 비동기 생성 도중 입력을 바꿔도 한 파일 안에 다른 시점 데이터가 섞이지 않게 입력 스냅샷 사용.
- [ ] 생성 실패 시 오류 안내·버튼 복구·입력 보존 확인 후 커밋.

## 단계 4 예시·검사·설명·배포 준비

- 수정: `scripts/check-planning.cjs`, `check-draft.cjs`, `check-draft-style.cjs`, `check-export.cjs`, `build-web.cjs`.
- 신규 권장: `scripts/check-plan-structure.cjs`; 실제 추가 시 `package.json`의 check에 연결.
- 수정: 기존 가상 예시·문장 기준·사용 방법·변경 이력.
- [ ] 예전 문장 fixture의 정확 일치 검사만 무작정 삭제하지 않음. 10개 항목·원문·수치·상태 보존 검사로 목적을 유지하며 갱신.
- [ ] `npm run check`, `npm run build:web` 통과.
- [ ] 실제 브라우저 입력·백업·복원·생성·다운로드 확인.
- [ ] DOCX·PDF 실제 파일의 목차·다열 표·근거·수치·미확인 대조.
- [ ] 운영자·시험·일반 사용자 통계·동의 회귀 검사.
- [ ] 결과·미해결 제한·실제 배포 여부 작성 후 검토 요청.

## 명령

```sh
npm ci
npm run check
npm run build:web
```

- `npm ci`는 의존성 설치가 필요할 때 실행.
- 기능 수정 없이 문서만 저장한 상태를 구현 완료로 보고하지 않음.
- 환경에 없는 도구·스킬은 필수 전제로 만들지 않음. 검증하지 못한 부분은 그대로 명시.
