(function(root){
'use strict';
const rules=[
 [/공고|평가표|자격|지원사업|집행 지침/, '주최·지원기관의 해당 회차 공고 원문과 첨부 양식', '공고명·회차·수정일·평가 항목과 제출 조건을 기록합니다.', [['K-Startup','https://www.k-startup.go.kr/web']]],
 [/수요|산업|입지|경쟁|시장/, '내부 판매 기록·목표 고객 조사·경쟁사 공식 판매 페이지', '대상 지역·기간·고객군·가격 조건을 맞추고 관심과 실제 구매를 구분합니다.', [['KOSIS','https://kosis.kr/'],['공공데이터포털','https://www.data.go.kr/'],['한국관광 데이터랩','https://datalab.visitkorea.or.kr/']]],
 [/객실|예약|체류|입퇴|점유|공실|린넨/, '예약·객실관리 시스템, 입퇴실 대장, 객실정비·린넨 기록의 담당자', '객실·공간 단위, 판매 가능 기간, 취소·제외 조건과 작업시간을 함께 수집합니다.', []],
 [/급여|근태|근무|휴무|인력|역량|채용|교육/, '인사·급여·근태 담당자, 현장 근무표, 업무량 관찰·교육 기록', '시간대별 업무량·휴무·대체 시간을 확인하고 개인 정보는 집계·익명화합니다.', []],
 [/회계|원장|계정|현금|채권|채무|정산|청구|수납|입금|반환|지급|매출|손익/, '회계·자금 담당자의 원장·청구서·정산서·입출금 일정', '기간·통화·세금·발생과 실제 지급을 구분하고 합계와 원자료를 대조합니다.', []],
 [/견적|원가|단가|구매|재고|품목|식재료|부품|공급|납기|폐기/, '구매 담당자·거래처의 일자 있는 견적서, 발주·입출고·폐기 기록', '규격·수량·세금·운송·설치·유지 조건을 맞춰 비교합니다.', []],
 [/계약|권한|권리|의무|지침|기준·검토|적용 일정/, '계약·법무·전문 검토 담당자와 해당 계약·기관의 원문', '적용 대상·개정일·검토자·책임 범위를 기록하며 추측한 기준을 사용하지 않습니다.', []],
 [/고장|설비|자산|도면|정비|점검|가동|계량|기후|환경 측정/, '시설 담당자·설비대장·제조사 지침·정비·계량 기록', '설비 번호·운전 조건·측정 단위·기준 기간·누락과 이상값을 기록합니다.', []],
 [/안전|위험|사고|훈련|작업|비상|현장/, '현장 책임자의 점검·위험·훈련 기록과 적격 검토자의 확인 자료', '현장·작업 범위·기준일·미해결 사항을 적고 실제 적용 여부를 별도 확인합니다.', []],
 [/민원|불만|지원|고객|이용|서비스|품질|오류|재작업/, '고객지원·운영 기록, 대상 이용자 인터뷰·업무 관찰', '표본·모집 방법·질문·처리 단계·중복과 미접수 가능성을 남깁니다.', []],
 [/기능|시스템|행동|유입|콘텐츠|과업|시제품|제품 시험/, '서비스 운영 담당자·분석 도구·오류 기록·이용자 과업 시험', '측정 이벤트·분모·기간·동의·도구 누락과 실제 과업 성공을 구분합니다.', []]
];
function guide(name){const r=rules.find(r=>r[0].test(name));return r?{source:r[1],method:r[2],links:r[3]}:{source:'해당 업무 담당자·원본 기록·공급자·대상자 직접 조사',method:'기준 기간·범위·단위·원본 위치를 확인하고 확보할 수 없으면 미확인으로 남깁니다.',links:[]};}
function requirements(C,selected){return selected.flatMap(id=>{const t=C.types.find(t=>t.id===id);return t?t.data.map((name,i)=>{const g=guide(name);return {id:`E-${id}-${i+1}`,module:id,moduleName:t.name,name,...g,links:g.links.filter(([label])=>label!=='한국관광 데이터랩'||['hotel','residence'].includes(t.group))};}):[];});}
function filled(v){return typeof v==='string'&&v.trim()&&!/^(미확인|미정|없음|모름)(\s|$|[—:\-])/.test(v.trim());}
function status(e){if(!filled(e?.content))return '미확인 — 자료 내용 없음';if(e.traces?.some(t=>t.uncertain))return '미확인 — 불확실한 파일 추출(수식·오류·생략 등)';if(e.traces?.length&&!e.reviewed)return '미확인 — 파일 추출 원문 미검토';if(e.kind!=='actual')return e.kind==='sample'?'미확인 — 가상·연습 자료':'미확인 — 가정·추정 자료';if(!filled(e.source)||!filled(e.period))return '미확인 — 출처 또는 기준 기간 부족';return '입력 근거 연결 — 원문·주장 적합성 미검증';}
function usable(e){return status(e).startsWith('입력 근거 연결');}
function refsFor(state,key,allowed){const raw=state.references?.[key]||'';return [...new Set(raw.split(/[,，\s]+/).filter(x=>allowed.has(x)))];}
function generate(C,state){
 const req=requirements(C,state.selected),allowed=new Set(req.map(r=>r.id)),records=state.materials||{},missing=[],titles=state.selected.map(id=>C.types.find(t=>t.id===id)?.name).filter(Boolean);
 const value=v=>typeof v==='string'&&v.trim()?v.trim():'';
 function claim(label,text,key){const ids=refsFor(state,key,allowed),valid=ids.filter(id=>usable(records[id]));if(!filled(text)){missing.push(label+'：내용과 근거를 수집');return `- 미확인 — ${label}에 필요한 내용이 입력되지 않았습니다.`;}if(!valid.length){missing.push(label+'：적용 가능한 실제 출처·기간·내용을 연결');return `- [미확인: 연결된 실제 근거 없음]\n\n${value(text)}${ids.length?'\n\n연결 자료: '+ids.join(', '):''}`;}return `- [입력 근거 연결: ${valid.join(', ')} / 원문·주장 적합성 미검증]\n\n${value(text)}`;}
 let md=`# ${value(state.common.title)||'미확인 — 기획 제목'}\n\n표준 v${C.version} · 입력 자료 기반 기획서 초안\n\n- 작성 기준: 입력 내용·수집 자료\n- 별도 검토: 원문·계산·법적 판단\n- 권장 수집처: 조사 안내용, 수집된 근거 아님\n\n## 기획 개요\n\n- 검토 기획: ${titles.join(' · ')||'미확인 — 기획 미선택'}\n- 적용 대상: ${value(state.common.target)||'미확인'}\n- 적용 기간: ${value(state.common.period)||'미확인'}\n\n## 공통 기획\n\n`;
 const labels={target:'대상·자산·조직',period:'기획 기간',budget:'예산·자금 한도',owner:'담당·승인자',goal:'성과 목표·기준선',context:'배경·현황·대안',execution:'실행·자원·의존성',evidence:'근거·데이터·검증 계획',economics:'수익·비용·현금 또는 내부 개선 효과',decision:'위험·판정·다음 행동'};
 for(const [k,label]of Object.entries(labels))md+=`### ${label}\n\n${claim(label,state.common[k],'common:'+k)}\n\n`;
 for(const id of state.selected){const t=C.types.find(t=>t.id===id);if(!t)continue;md+=`## ${t.name}\n\n- 검토 목적: ${t.purpose}\n\n`;for(const q of t.questions)md+=`### ${q}\n\n${claim(t.name+' / '+q,state.answers[id]?.[q],id+':'+q)}\n\n`;md+=`### 입력 자료에서 확인할 내용\n\n`;for(const r of req.filter(r=>r.module===id)){const e=records[r.id];md+=`- ${r.id} · ${r.name}: ${status(e)}\n`;if(e?.content)md+=`\n- 입력한 자료 내용: ${e.content}\n\n`;else missing.push(`${t.name} / ${r.name}：${r.source}에서 수집`);}md+=`\n### 실행·검증 제안\n\n- [제안] ${t.gate}\n- 사전 확정: 판단 기준·담당자·기한·비용\n- 검증 결과: 별도 확인 필요\n\n- 추천 산출물: ${t.outputs.join(' · ')}\n\n- 추천 지표: ${t.metrics.join(' · ')}\n- 기준선·목표·분모·측정 기간: 미확인\n\n`;}
 md+='## 단계별 실행 제안\n\n- 구분: [제안] 추가 조사·실행 계획\n- 실제 일정·예산: 별도 검토\n\n1. 자료 확보: 조사 담당·수집처·기준 기간 확정, 원자료 수집\n2. 대안 검토: 기간·단위 통일, 반대 근거·자원 중복 확인\n3. 시범 검증: 범위·판단 기준·책임자·기한·손실 한도 설정\n4. 판단: 검증 결과·실제 비용·운영 조건 검토, 진행·보완·보류·중단 기록\n\n- 담당·일정·예산: 작성자 입력 별도 검토, 미입력 부분은 미확인\n\n';
 md+='## 근거 목록\n\n';for(const r of req){const e=records[r.id]||{};md+=`### ${r.id} · ${r.name}\n\n- 상태: ${status(e)}\n- 자료 성격: ${e.kind==='actual'?'실제 자료(사용자 지정)':e.kind==='sample'?'가상·연습 자료':'가정·추정 또는 미지정'}\n- 출처·원본 위치: ${value(e.source)||'미확인'}\n- 기준 기간·범위: ${value(e.period)||'미확인'}\n- 내용: ${value(e.content)||'미확인'}\n- 한계·반대 근거: ${value(e.limit)||'미확인'}\n- 권장 수집처(미수집): ${r.source}\n- 수집 방법: ${r.method}\n\n`;if(!usable(e))missing.push(`${r.id} / ${r.name}：${status(e)}`);}
 md+='## 파일 출처와 추출 상태\n\n';for(const r of req){const e=records[r.id];for(const t of e?.traces||[])md+=`### ${r.id} / ${t.blockId}\n\n- 파일: ${t.filename}\n- 위치: ${t.location}\n- SHA-256: ${t.sha256}\n- 원문 검토: ${e.reviewed?'사용자 검토 표시(사실·계산 검증은 별도)':'미확인 — 미검토'}\n- 추출 방식: ${t.method==='ocr'?'OCR / 인식 점수 '+(t.confidence??'미확인'):'텍스트'}\n- 추출 한계: ${t.reasons?.join(' · ')||'원문과 의미·순서 대조 필요'}\n- 추출 원문:\n\n${t.text}\n\n`;}
 for(const doc of state.imports||[])md+=`- 보관 파일: ${doc.name} / ${doc.sha256}\n  - ${doc.issues?.join(' / ')||'추출은 사실 확인이 아님'}\n`;
 md+='\n## 미확인 사항과 추가 조사\n\n'+[...new Set(missing)].map(x=>'- '+x).join('\n')+'\n\n## 통합 충돌 자가 점검\n\n';
 const checks=['가정·기간 일치','자원·효과 중복','예산·현금 구분','지표 정의','선행 조건'];md+=checks.map((x,i)=>`- [${state.checks[i]?'x':' '}] ${x} — 작성자 자가 확인`).join('\n')+`\n\n- 조정 기록: ${value(state.common.conflicts)||'미확인'}\n\n## 최종 판정\n\n- 미확인 — 이 초안은 진행·투자·승인을 자동 결정하지 않습니다. 미확인 자료와 반대 근거를 검토한 후 담당자가 결정합니다.\n`;
 return md;
}
const engine={guide,requirements,status,usable,generate};if(typeof module!=='undefined'&&module.exports)module.exports=engine;else root.PlanningDraft=engine;
})(typeof globalThis!=='undefined'?globalThis:this);
