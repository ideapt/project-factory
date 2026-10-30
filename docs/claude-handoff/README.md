# Claude 개발 인수인계

- 작성일: 2026-10-29
- 개정일: 2026-10-30
- 개발 지시 범위: 구현·검증·공개 배포까지
- 목적: 프로젝트 공장의 기획서 생성 기능을 공통 10개 항목 기준으로 업그레이드
- 현재 단계: 요구사항·개발 지시 준비 완료 / 해당 업그레이드 구현 전
- 이번 전달물: 문서·가상 시험 명세 / 사이트 기능 변경 아님
- 기준 소스: GitHub 커밋 `35cc6189cd0946f4171a3572e81e23c863cce607`
- 저장소: https://github.com/ideapt/project-factory
- 공개 사이트: https://ideapt.github.io/project-factory/

## 바로 시작

1. 저장소의 최신 코드를 별도 작업 폴더에 받기.
2. [Claude 지시문](06-claude-instructions.md)의 본문을 Claude에 전달.
3. 이 폴더의 문서와 `examples/`를 함께 제공.
4. Claude가 현재 코드와 문서를 비교한 뒤 구현·검증·공개 배포까지 진행.
5. 결과는 [인수 점검표](08-delivery-checklist.md)로 확인.

## 문서 목록

| 파일 | 용도 |
|---|---|
| [01-current-state.md](01-current-state.md) | 현재 구현·파일 구조·제약·보호 기준 |
| [02-upgrade-requirements.md](02-upgrade-requirements.md) | 실제 제품 요구사항·10개 항목·입력·상태 규칙 |
| [03-planning-prompt.md](03-planning-prompt.md) | 기획서 작성 기준·재사용 프롬프트 |
| [04-implementation-plan.md](04-implementation-plan.md) | 단계별 구현 계획·권장 인터페이스·수정 파일 |
| [05-acceptance-tests.md](05-acceptance-tests.md) | 회귀·기능·브라우저·파일 검증 기준 |
| [06-claude-instructions.md](06-claude-instructions.md) | 복사해서 전달할 개발 지시문 |
| [07-business-example.md](07-business-example.md) | 프로젝트 공장 자체를 대상으로 한 별도 사업 기획 예시 |
| [08-delivery-checklist.md](08-delivery-checklist.md) | 개발 결과 인수·완료 보고 양식 |
| [09-preparation-validation.md](09-preparation-validation.md) | 전달 문서 준비 검증과 구현 전 상태 |
| [examples/README.md](examples/README.md) | 가상 입력·추가 구조·기대 결과 설명 |

## 문서 우선순위

- 사용자의 새 지시 > 제품 요구사항 > 검증 기준 > 개발 계획 > 일반 작성 프롬프트.
- 프롬프트의 모든 문장을 그대로 화면 문구로 노출할 필요 없음.
- 기존 데이터·출처·수치·미확인 보존 기준은 문체 개선보다 우선.
- `07-business-example.md`는 출력 형식 참고용. 서비스 이용자의 기획 내용을 대신하지 않음.
- 프롬프트를 저장하는 것만으로 기능 구현 완료 처리 금지.

## 완료의 의미

- 사이트에서 입력 → 10개 항목 초안 → 워드·PDF 생성까지 실제 동작.
- 기존 작성본·자료 추출·OCR·통계 구분 유지.
- 자동 검사·브라우저 검사·파일 내용 검증 증거 확보.
- 검증 후 기존 공개 사이트 배포·실제 반영·다운로드 재점검까지 완료.
- 현재 문서 묶음은 위 기능을 구현했다는 뜻이 아님.

## Claude 업로드용 ZIP

- [2026-10-30 개정 ZIP](../../downloads/project-factory-claude-handoff-2026-10-30.zip)
- [파일 해시·무결성 목록](../../downloads/project-factory-claude-handoff-2026-10-30.manifest.json)
- ZIP은 전달 문서·가상 예시·기존 안내를 포함. 앱 소스는 저장소에서 확인.
- 배포 범위는 2026-10-30 개정 지시문 기준. 이전 ZIP 대신 이 개정본 사용.
