# 프로젝트 공장 통계 서버

기존 GitHub Pages 앱에서 허용한 익명 방문·문서 다운로드 이벤트를 받습니다. 클라우드 D1에 저장하며 운영 화면은 Sites의 검증된 로그인과 소유자 이메일 대조로 보호합니다. 운영자 설정은 런타임 비밀 환경 변수 ADMIN_EMAIL에만 두며 GitHub에 넣지 않습니다.

사용자가 전송 대상을 승인했습니다. 운영 환경에서 FEEDBACK_ENABLED=true로 활성화하며, 개별 사용자의 제출 동의가 있어야 의견을 저장합니다.

- 빌드: `node scripts/build.mjs`
- 검증: `node scripts/validate-artifact.mjs`
- 전체 논리 검사: 저장소 루트에서 `node scripts/check-insights.cjs`

배포는 Sites의 소스 저장·버전 저장·배포 절차를 사용합니다. GitHub Pages 배포와 별도입니다. 원본 기획서와 업로드 자료를 저장하는 서버가 아닙니다.
