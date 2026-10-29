# 가상 입력과 기대 결과

- 기존 호환 입력: `../../../examples/material-draft-demo.json`.
- 추가 구조 예시: [planning-extension.json](planning-extension.json).
- 추가 구조는 제안 스키마이며 현재 앱이 읽는 완성 작성본이 아님.
- 미래 버전 값은 여기서 임의 확정하지 않음. 구현 시 호환 정책과 함께 결정.

## 적용 방법

1. 기존 가상 예시를 불러온 뒤 새 `planning` 필드로 확장.
2. 선택 기획·기존 질문·E 근거 ID·자료·체크를 그대로 보존.
3. 새 입력은 state 정규화에서 허용 필드·타입·행 ID 검증.
4. 새 입력·행을 JSON으로 백업·복원하는 왕복 검사 추가.

## 제안 필드

| 필드 | 의미·빈 값 처리 |
|---|---|
| `meta.purpose`·`submissionTarget` | 기획 목적·제출 대상 / 빈 값 미확인 |
| `alternatives[]` | id·name·effect·cost·period·conditions·risk·referenceIds |
| `actions[]` | id·task·owner·due·resources·prerequisites·completion·referenceIds |
| `risks[]` | id·risk·response·decisionCondition·owner·referenceIds |
| `financials` | costs·benefits·cashTiming·formula·inputBasis·result·referenceIds |

- 기존 `common`의 owner·period·budget와 새 행의 값을 임의 덮어쓰지 않음.
- 새 행 referenceIds는 현재 선택 기획의 허용 근거만 연결. 원문 보관 자료는 삭제하지 않음.
- 금액·기한 등은 사용자 문자열로 보존. 숫자·날짜 자동 보정 금지.
- row ID는 사용자에게 근거 번호인 것처럼 표시하지 않음.
- 비어 있는 신규 financials.result는 미확인. 사용자 값은 입력 계산값으로 구분하며 엔진 계산 결과인 척하지 않음.

## 기대 결과

- 호텔 가상 예시: 전체 10개 항목·가상 상태·미확인 유지.
- 대안: ‘현행 유지’·추가 대안과 누락 비용·기간 표시.
- 실행: 사용자 입력 task 보존, owner·due 빈 값은 미확인.
- 위험: 원문과 대응·판단 조건 표시.
- 근거: 기존 `E-hotel-housekeeping-1` 보존, S 번호로 강제 변경 금지.
- 시험 자료를 실제 고객 실적·사업 성과로 제시하지 않음.
