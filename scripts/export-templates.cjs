'use strict';
const fs=require('node:fs'),path=require('node:path');
const C=require('../prototype/catalog.js');
const target=path.join(__dirname,'../templates/catalog');fs.mkdirSync(target,{recursive:true});
let index=`# 기획 양식 · ${C.types.length}개\n\n공통 표준과 함께 사용합니다. 직무·사업장·목적으로 같은 양식을 찾을 수 있습니다. 각 양식을 복사한 후 답변과 근거를 채웁니다. 기준 데이터는 prototype/catalog.js와 prototype/catalog-v04.js입니다.\n\n`;
for(const g of C.groups){index+=`## ${g.name}\n\n`;for(const t of C.types.filter(t=>t.group===g.id)){
  const text=`# ${t.name} 기획서\n\n유형 번호: ${t.id} · 표준 v${C.version}\n\n${t.purpose}\n\n## 공통 기획\n\n- 제목 / 작성자 / 버전 / 날짜:\n- 대상 고객·이용자·조직·자산 / 결제자 또는 승인자:\n- 배경·현황·현상 유지 대안:\n- 기준선 → 목표 / 측정 기간·분모:\n- 적용 기간 / 예산·자금·시간 한도:\n- 실행 단계·담당·선행 조건:\n- 비용·현금흐름·효과 산식과 입력 근거:\n- 위험·미확인·중단 조건:\n\n## 분야별 질문\n\n${t.questions.map(q=>`### ${q}\n\n답변: 미확인\n\n상태(사실·가정·추정·제안):\n근거 번호·출처·기준 시점·적용 범위:\n한계·반대 근거:\n다음 확인 방법·담당·기한:\n`).join('\n')}\n## 데이터 수집\n\n| 자료 | 출처·확보 가능성 | 기준 시점·단위·표본 | 한계 | 담당·기한 |\n|---|---|---|---|---|\n${t.data.map(d=>`| ${d} | 미확인 | 미확인 | 미확인 | 미정 |`).join('\n')}\n\n## 지표·검증\n\n${t.metrics.map(m=>`- ${m}: 기준선 / 목표 / 분자·분모 / 기간 / 출처·책임자 / 사전 기준`).join('\n')}\n\n검증 관점: ${t.gate}\n\n조사·검증 카드와 근거 목록을 연결하세요. 관측 전 기준과 판정 이유를 기록합니다.\n\n## 산출물\n\n${t.outputs.map(o=>`- ${o}`).join('\n')}\n\n## 최종 판단\n\n- 진행·보완·보류·중단과 이유:\n- 적용 범위 / 입증하지 못한 것:\n- 다음 행동·담당·기한·투자 한도:\n- 재검토 날짜 또는 조건:\n\n공통 작성법: [처음 사용하는 방법](../../docs/quickstart.md) · [확장 기획 체계](../../docs/planning-system.md)\n`;
  const tags=Object.entries(C.facets).map(([key,values])=>`${({roles:'직무',workplaces:'사업장',purposes:'기획 목적'})[key]}: ${t[key].map(id=>values.find(v=>v.id===id).name).join(' · ')}`).join('\n\n');
  fs.writeFileSync(path.join(target,t.id+'.md'),text.replace(t.purpose+'\n',t.purpose+'\n\n'+tags+'\n'),'utf8');index+=`- [${t.name}](${t.id}.md)\n`;
}index+='\n';}fs.writeFileSync(path.join(target,'README.md'),index,'utf8');console.log(`생성 완료: ${C.types.length}개 유형 양식과 목록`);

