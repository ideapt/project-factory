# 포함한 외부 라이브러리

v0.6 파일 읽기 기능에는 다음 공개 라이브러리의 배포물을 포함합니다. 프로젝트 자체 문서의 라이선스 미선택 상태와 별개로 이 배포물에는 아래 조건이 적용됩니다.

| 배포물 | 버전 | 라이선스·원문 |
|---|---|---|
| PDF.js / pdfjs-dist | 6.4.299 | Apache 2.0 · [보존 고지](prototype/vendor/pdfjs-dist-LICENSE.txt) · [원본](https://github.com/mozilla/pdf.js) |
| ExcelJS | 4.4.0 | MIT · [보존 고지](prototype/vendor/exceljs-LICENSE.txt) · [원본](https://github.com/exceljs/exceljs) |
| fflate | 0.8.3 | MIT · [보존 고지](prototype/vendor/fflate-LICENSE.txt) · [원본](https://github.com/101arrowz/fflate) |

PDF.js의 브라우저 모듈과 워커를 로컬 일반 스크립트로 묶어 파일 주소에서도 사용할 수 있도록 변환했습니다. 변환 도구는 esbuild 0.25.12입니다. 원본 라이브러리 기능의 정확성·적합성을 이 프로젝트가 인증하지 않습니다. 번들에 보존된 라이선스 주석을 유지합니다. 의존성 버전은 package-lock.json에 기록했습니다.

## v0.7 OCR

- Tesseract.js 7.0.0: Apache 2.0, [고지](prototype/vendor/ocr/tesseract-LICENSE.md), [원본](https://github.com/naptha/tesseract.js)
- tesseract.js-core 7.0.0: Apache 2.0, [고지](prototype/vendor/ocr/LICENSE), [원본](https://github.com/naptha/tesseract.js-core)
- 한국어·영어 언어 파일: @tesseract.js-data/kor·eng 1.0.0 패키지의 4.0.0 모델, [배포 저장소](https://github.com/naptha/tessdata). 패키지 메타데이터의 라이선스는 MIT입니다. 패키지 메타데이터와 모델 출처는 vendor/ocr에 함께 보존합니다.

배포 스크립트의 추가 고지 파일과 라이선스 주석도 보존합니다. OCR 모델·코드를 수정하거나 인식 정확도를 보증하지 않습니다.

## 문서 내보내기

- pdfmake 0.2.20: MIT, [고지](prototype/vendor/export/pdfmake-LICENSE.txt), [원본](https://github.com/bpampuch/pdfmake). 브라우저 배포 번들의 라이선스 주석을 보존합니다.
- NanumGothic-Regular.ttf: SIL OFL 1.1, [고지](prototype/vendor/export/NanumGothic-OFL.txt), [원본](https://github.com/google/fonts/tree/main/ofl/nanumgothic). 원본 글꼴을 수정하지 않고 로컬 파일 및 base64 데이터로 배포하며 PDF에 포함합니다.

## 자체 자료와의 구분

루트 LICENSE는 이 프로젝트 자체 코드·문서·양식에 적용하는 MIT 라이선스입니다. 위의 외부 배포물과 글꼴·모델에는 해당 고지의 별도 조건이 적용됩니다.
