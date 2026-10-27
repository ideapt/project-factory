'use strict';
const assert=require('node:assert/strict'),C=require('../prototype/catalog.js'),D=require('../prototype/draft-engine.js');
const id='hotel-housekeeping',t=C.types.find(t=>t.id===id),r=D.requirements(C,[id]);
assert.equal(r.length,3);assert(r.every(x=>x.source&&x.method));assert(D.guide('기타 조사 자료').source);
for(const type of C.types)for(const x of D.requirements(C,[type.id]))assert(x.source&&x.method);
const s={version:C.version,selected:[id],common:{title:'가상 시험 초안',target:'가상 A호텔'},answers:{[id]:{[t.questions[0]]:'퇴실이 오전에 집중되어 정비 배치를 검토한다.'}},checks:[],materials:{},references:{}};
let md=D.generate(C,s);assert(md.includes('[미확인: 연결된 실제 근거 없음]'));assert(md.includes('미확인 — 자료 내용 없음'));assert(!md.includes('검증 완료'));
const e=r[0].id;s.materials[e]={kind:'sample',source:'연습용 파일',period:'가상 10월',content:'객실 20개라는 가상값',limit:'학습용'};s.references[id+':'+t.questions[0]]=e;
md=D.generate(C,s);assert(md.includes('미확인 — 가상·연습 자료'));assert(md.includes('[미확인: 연결된 실제 근거 없음]'));
s.materials[e].kind='actual';s.materials[e].source='';assert(!D.usable(s.materials[e]));s.materials[e].source='테스트 원본 위치';s.materials[e].period='';assert(!D.usable(s.materials[e]));
s.materials[e].period='2026-10 / 테스트 자료';assert(D.usable(s.materials[e]));md=D.generate(C,s);assert(md.includes('[입력 근거 연결: '+e));assert(md.includes('원문·주장 적합성 미검증'));assert(md.includes('객실 20개라는 가상값'));
assert(!D.usable({...s.materials[e],source:'미확인'}));assert(!D.usable({...s.materials[e],content:'미확인 — 수집 필요'}));
s.materials[e].kind='assumption';assert(!D.usable(s.materials[e]));s.materials[e].kind='actual';s.references[id+':'+t.questions[0]]='E-does-not-exist';assert(D.generate(C,s).includes('[미확인: 연결된 실제 근거 없음]'));
s.materials[e].traces=[{blockId:'ocr-line',filename:'scan.pdf',location:'PDF 1페이지 OCR',sha256:'test-hash',text:'20',method:'ocr',confidence:60,uncertain:true,reasons:['낮은 점수']}];s.materials[e].reviewed=true;assert(!D.usable(s.materials[e]));assert(D.generate(C,s).includes('OCR / 인식 점수 60'));
// 해제한 모듈의 자료는 남겨 두되 초안에서 제외합니다.
s.selected=['cash'];md=D.generate(C,s);assert(!md.includes('객실 20개라는 가상값'));assert(md.includes('미확인'));
console.log('초안 검증 통과: 63개 기획 수집 안내, 빈 자료·가상·추정·출처/기간 누락·잘못된 번호·선택 해제 자료 제외·근거 추적');
