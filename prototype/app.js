'use strict';
const C=window.PlanningCatalog;
const KEY='project-factory-planning-v03';
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const byId=id=>C.types.find(t=>t.id===id);
const commonLabels={title:'기획 제목',target:'대상·자산·조직',period:'기획 기간',budget:'예산·자금 한도',owner:'담당·승인자',goal:'성과 목표·기준선',context:'배경·현황·대안',execution:'실행·자원·의존성',evidence:'근거·데이터·검증 계획',economics:'수익·비용·현금 또는 내부 개선 효과',decision:'위험·판정·다음 행동',conflicts:'충돌과 조정 기록'};
const checkLabels=['고객·조직·자산·기간의 가정이 일치합니다.','공용 인력·시설·비용·매출·절감액의 중복을 확인했습니다.','총예산·부문 예산·현금 지급 시점을 구분했습니다.','지표의 기준선·분모·기간·담당을 확인했습니다.','선행 승인·계약·공사·시스템 의존성을 확인했습니다.'];
const blank=()=>({version:C.version,selected:[],common:{},answers:{},checks:[],materials:{},references:{},imports:[]});
function normalize(x){
  if(!x||typeof x!=='object'||Array.isArray(x)||!['0.3.0','0.4.0','0.5.0','0.6.0',C.version].includes(x.version)||!Array.isArray(x.selected)||!x.common||typeof x.common!=='object'||!x.answers||typeof x.answers!=='object') throw new Error('지원하는 v0.3~v0.7 작성본 형식이 아닙니다.');
  const n=blank();n.selected=[...new Set(x.selected.filter(id=>typeof id==='string'&&byId(id)))];
  for(const key of Object.keys(commonLabels)) if(typeof x.common[key]==='string') n.common[key]=x.common[key];
  for(const t of C.types){const a=x.answers[t.id];if(a&&typeof a==='object'){n.answers[t.id]={};for(const q of t.questions) if(typeof a[q]==='string') n.answers[t.id][q]=a[q];}}
  for(const r of window.PlanningDraft.requirements(C,C.types.map(t=>t.id))){const e=x.materials?.[r.id];if(e&&typeof e==='object'){n.materials[r.id]={};for(const k of ['source','period','content','limit'])if(typeof e[k]==='string')n.materials[r.id][k]=e[k];n.materials[r.id].kind=['actual','sample','assumption'].includes(e.kind)?e.kind:'assumption';}}
  const refKeys=[...Object.keys(commonLabels).map(k=>'common:'+k),...C.types.flatMap(t=>t.questions.map(q=>t.id+':'+q))];
  for(const k of refKeys)if(typeof x.references?.[k]==='string')n.references[k]=x.references[k];
  n.imports=Array.isArray(x.imports)?x.imports.slice(0,5).map(d=>({id:String(d.id||''),name:String(d.name||''),sha256:String(d.sha256||''),kind:String(d.kind||''),size:Number(d.size)||0,issues:Array.isArray(d.issues)?d.issues.map(String):[],pages:Array.isArray(d.pages)?d.pages.slice(0,10).filter(p=>typeof p.image==='string'&&/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(p.image)&&p.image.length<3000000).map(p=>({number:Number(p.number),width:Number(p.width),height:Number(p.height),image:p.image,status:String(p.status||'미확인')})):[],blocks:Array.isArray(d.blocks)?d.blocks.slice(0,1500).map(b=>({id:String(b.id||''),location:String(b.location||''),text:String(b.text||'').slice(0,4000),uncertain:b.uncertain===true,method:b.method==='ocr'?'ocr':'text',page:Number(b.page)||null,confidence:Number.isFinite(b.confidence)?b.confidence:null,bbox:b.bbox&&typeof b.bbox==='object'?b.bbox:null,words:Array.isArray(b.words)?b.words.map(w=>({text:String(w.text||''),confidence:Number.isFinite(w.confidence)?w.confidence:null,bbox:w.bbox})):[],reasons:Array.isArray(b.reasons)?b.reasons.map(String):[]})):[]})):[];
  for(const r of window.PlanningDraft.requirements(C,C.types.map(t=>t.id))){const old=x.materials?.[r.id],m=n.materials[r.id];if(!m)continue;m.reviewed=old.reviewed===true;m.traces=Array.isArray(old.traces)?old.traces.slice(0,100).map(t=>({fileId:String(t.fileId||''),blockId:String(t.blockId||''),filename:String(t.filename||''),location:String(t.location||''),sha256:String(t.sha256||''),text:String(t.text||'').slice(0,4000),uncertain:t.uncertain===true,method:t.method==='ocr'?'ocr':'text',confidence:Number.isFinite(t.confidence)?t.confidence:null,page:Number(t.page)||null,reasons:Array.isArray(t.reasons)?t.reasons.map(String):[]})):[];}
  n.checks=checkLabels.map((_,i)=>x.checks?.[i]===true);return n;
}
let state=blank(),active='site',filter='',axis='roles';
const filters={roles:'',workplaces:'',purposes:''};
const names=(key,ids)=>ids.map(id=>C.facets[key].find(x=>x.id===id)?.name||id).join(' · ');
function matches(t){const f=filter.trim().toLowerCase();return Object.entries(filters).every(([k,v])=>!v||t[k].includes(v))&&(!f||[t.name,t.purpose,...t.questions,...t.data,...Object.keys(filters).map(k=>names(k,t[k]))].join(' ').toLowerCase().includes(f));}
try{const saved=localStorage.getItem(KEY);if(saved)state=normalize(JSON.parse(saved));}catch(e){$('#save-status').textContent='저장 내용을 읽지 못했습니다. JSON 백업으로 복원할 수 있습니다.';}
function save(){$('#draft-status').textContent='입력 내용이 변경되었습니다. 초안을 다시 만들어 최신 내용을 확인하세요.';try{localStorage.setItem(KEY,JSON.stringify(state));$('#save-status').textContent='이 브라우저에 저장됨';}catch(e){$('#save-status').textContent='자동 저장 실패 — JSON 백업을 내려받으세요.';}}
function tree(){
  $('#catalog-count').textContent=`3가지 입구 · ${C.types.length}개 기획`;
  $('#tree').innerHTML=`<button class="tree-link" data-facet="" data-facet-axis="${axis}">이 기준 전체 보기</button>`+C.facets[axis].map(g=>{const items=C.types.filter(t=>t[axis].includes(g.id));return `<details ${filters[axis]===g.id?'open':''}><summary>${esc(g.name)} <small>${items.length}</small></summary><button class="tree-link ${filters[axis]===g.id?'active':''}" data-facet="${g.id}" data-facet-axis="${axis}">이 조건으로 찾기</button>${items.map(t=>`<button class="tree-link ${active===t.id?'active':''}" data-view="${t.id}" aria-pressed="${active===t.id}">${esc(t.name)}</button>`).join('')}</details>`;}).join('');
  document.querySelectorAll('[data-axis]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.axis===axis)));
}
function cards(){
 const types=C.types.filter(matches);
 $('#group-title').textContent='조건에 맞는 기획';$('#result-count').textContent=`${types.length}개 유형`;
 $('#filter-summary').textContent=Object.entries(filters).filter(([k,v])=>v).map(([k,v])=>names(k,[v])).join(' + ')||'전체 직무 · 전체 사업장 · 전체 목적';
 $('#cards').innerHTML=types.length?types.map(t=>`<article class="card ${active===t.id?'active':''}"><small>${esc(C.groups.find(g=>g.id===t.group).name)}</small><h3>${esc(t.name)}</h3><p>${esc(t.purpose)}</p><button data-view="${t.id}" aria-label="${esc(t.name)} 질문과 데이터 보기">질문과 데이터 보기 ↗</button></article>`).join(''):'<p class="empty">검색 결과가 없습니다. 다른 단어로 검색하거나 검색어를 지워주세요.</p>';
}
function detail(){const t=byId(active),chosen=state.selected.includes(t.id);$('#detail').innerHTML=`<span class="tag">${esc(C.groups.find(g=>g.id===t.group).name)}</span><h2 id="detail-title">${esc(t.name)}</h2><p>${esc(t.purpose)}</p><p class="scope-tags">직무: ${esc(names('roles',t.roles))}<br>사업장: ${esc(names('workplaces',t.workplaces))}<br>목적: ${esc(names('purposes',t.purposes))}</p>${matches(t)?'':'<p class="outside-filter">현재 보고 있는 기획은 탐색 조건 밖입니다. 선택 목록에는 직접 추가할 수 있습니다.</p>'}<h3>먼저 답할 질문</h3><ol>${t.questions.map(q=>`<li>${esc(q)}</li>`).join('')}</ol><h3>필요한 데이터</h3><ul>${t.data.map(d=>`<li><b>${esc(d)}</b><br>수집처: ${esc(window.PlanningDraft.guide(d).source)}</li>`).join('')}</ul><h3>검증 관점</h3><p>${esc(t.gate)}</p><h3>추천 산출물</h3><p>${esc(t.outputs.join(' · '))}</p><button class="primary" data-add="${t.id}" ${chosen?'disabled':''}>${chosen?'선택 목록에 추가됨':'내 기획에 추가 ＋'}</button>`;}
function composer(){
 $('#mode').textContent=state.selected.length>1?`${state.selected.length}개 통합기획`:state.selected.length===1?'개별 기획':'기획 선택 전';
 $('#selected').innerHTML=state.selected.length?state.selected.map(id=>`<button data-remove="${id}" aria-label="${esc(byId(id).name)} 선택 해제">${esc(byId(id).name)} ×</button>`).join(''):'<p class="empty">기획을 추가하거나 위의 추천 조합을 선택하세요. 공통 내용은 먼저 작성할 수 있습니다.</p>';
 $('#module-forms').innerHTML=state.selected.map(id=>{const t=byId(id);return `<section class="module-form"><span class="eyebrow">${esc(id)}</span><h3>${esc(t.name)}</h3><p>추천 지표: ${esc(t.metrics.join(' · '))}. 실제 목표값·분모·측정 기간·출처를 답변에 적어주세요.</p>${t.questions.map((q,i)=>`<label>${i+1}. ${esc(q)}<textarea data-module="${id}" data-question="${i}" placeholder="사실·가정·추정을 구분하고 근거 번호를 연결하세요.">${esc(state.answers[id]?.[q]||'')}</textarea></label>${referenceField(id+':'+q)}`).join('')}</section>`;}).join('');
 collection();fileTargets();renderImports();
 $('#common-references').innerHTML='<details class="ref-panel"><summary>공통 기획의 근거 연결</summary><p>아래 자료 번호를 복사해 해당 항목에 연결하세요. 여러 개는 쉼표로 구분합니다. 근거를 연결해도 사실 검증을 자동 완료하지 않습니다.</p>'+Object.entries(commonLabels).filter(([k])=>!['title','conflicts'].includes(k)).map(([k,label])=>`<div>${esc(label)}${referenceField('common:'+k)}</div>`).join('')+'</details>';
 $('#draft-preview').textContent='기획서 초안 만들기를 눌러 현재 자료를 반영하세요.';
 $('#generate-draft').disabled=!state.selected.length;
 $('#checks').innerHTML=checkLabels.map((label,i)=>`<label class="check"><input type="checkbox" data-check="${i}" ${state.checks[i]?'checked':''}>${esc(label)}</label>`).join('');
 $('#export-md').disabled=!state.selected.length;
}
function fillCommon(){document.querySelectorAll('[data-common]').forEach(el=>el.value=state.common[el.dataset.common]||'');}
function refresh(){tree();cards();detail();composer();}
function exportMarkdown(){return window.PlanningDraft.generate(C,state);}
function referenceField(key){return `<label class="reference-label">연결할 근거 번호<input data-reference="${esc(key)}" value="${esc(state.references[key]||'')}" placeholder="예: E-hotel-housekeeping-1, E-hotel-housekeeping-2"></label>`;}
function collection(){const req=window.PlanningDraft.requirements(C,state.selected);$('#collection-forms').innerHTML=req.length?req.map((r,i)=>{const e=state.materials[r.id]||{};const field=(k,label,area=false)=>`<label>${label}${area?`<textarea data-material="${r.id}" data-material-field="${k}">${esc(e[k]||'')}</textarea>`:`<input data-material="${r.id}" data-material-field="${k}" value="${esc(e[k]||'')}">`}</label>`;return `<details class="material-card" ${i===0?'open':''}><summary>${esc(r.moduleName)} · ${esc(r.name)}<small id="status-${r.id}">${esc(window.PlanningDraft.status(e))}</small></summary><p><b>근거 번호: ${r.id}</b></p><p>권장 수집처: ${esc(r.source)}</p><p>수집 방법: ${esc(r.method)}</p>${r.links.length?'<p>'+r.links.map(([name,url])=>`<a href="${url}" target="_blank" rel="noopener noreferrer">${esc(name)} ↗</a>`).join(' · ')+' — 자료를 찾는 입구이며 수집된 근거가 아닙니다.</p>':''}<label>자료 성격<select data-material="${r.id}" data-material-field="kind"><option value="assumption" ${!e.kind||e.kind==='assumption'?'selected':''}>가정·추정 / 미지정</option><option value="actual" ${e.kind==='actual'?'selected':''}>실제 자료 (내가 확인한 원본)</option><option value="sample" ${e.kind==='sample'?'selected':''}>가상·연습 자료</option></select></label>${field('source','실제 출처·원본 위치 (URL 또는 파일명·담당자)')}${field('period','자료의 기준 기간·대상·단위')}${field('content','자료 내용·수치·관측 사실',true)}${field('limit','한계·누락·반대 근거',true)}${e.traces?.length?`<div class="file-traces"><h4>연결된 파일 원문</h4>${e.traces.map(t=>`<p>${esc(t.filename)} / ${esc(t.location)}<br>SHA-256: ${esc(t.sha256)}</p><pre>${esc(t.text)}</pre>`).join('')}<label class="check"><input type="checkbox" data-review="${r.id}" ${e.reviewed?'checked':''}>추출 위치와 내용을 원문에서 검토했습니다 (진실·계산 검증 완료를 뜻하지 않음)</label></div>`:''}</details>`;}).join(''):'<p>기획을 선택하면 필요한 데이터와 수집처가 표시됩니다.</p>';}
function materialInput(t){if(!t.dataset.material)return;const id=t.dataset.material,k=t.dataset.materialField;if(!['source','period','content','limit','kind'].includes(k))return;state.materials[id]??={};state.materials[id][k]=t.value;if(state.materials[id].traces?.length){state.materials[id].reviewed=false;const check=$('[data-review="'+id+'"]');if(check)check.checked=false;}$('#status-'+id).textContent=window.PlanningDraft.status(state.materials[id]);save();}
function fileTargets(){const el=$('#file-target'),old=el.value,req=window.PlanningDraft.requirements(C,state.selected);el.innerHTML=req.length?req.map(r=>`<option value="${r.id}">${esc(r.moduleName+' / '+r.name+' / '+r.id)}</option>`).join(''):'<option value="">먼저 기획을 선택하세요</option>';if(req.some(r=>r.id===old))el.value=old;}
function compareOCR(doc,block){const page=doc.pages?.find(p=>p.number===block.page),lines=doc.blocks.filter(b=>b.method==='ocr'&&b.page===block.page);const box=block.bbox;const rect=box&&[box.x0,box.x1,box.y0,box.y1].every(Number.isFinite)?`<svg viewBox="0 0 ${page?.width||1} ${page?.height||1}" aria-hidden="true"><rect x="${box.x0}" y="${box.y0}" width="${Math.max(0,box.x1-box.x0)}" height="${Math.max(0,box.y1-box.y0)}" fill="#e9a62733" stroke="#b85819" stroke-width="4"/></svg>`:'';$('#ocr-compare-body').innerHTML=`<p>${esc(doc.name)} / PDF ${block.page}페이지 · SHA-256 ${esc(doc.sha256)}</p><p>OCR 점수는 정확도 확률이 아닙니다. 문장 85 미만 또는 단어 75 미만·점수 없음은 미확인으로 표시합니다. 숫자·이름·단위는 원문과 직접 대조하세요.</p><div class="ocr-columns"><div class="page-image">${page?`<img src="${page.image}" alt="${esc(doc.name)} ${block.page}페이지 원본 PDF 렌더링">${rect}`:'<p>미확인 — 원본 페이지 이미지가 없습니다. 원본 PDF를 별도로 확인하세요.</p>'}</div><div>${lines.map(b=>`<article class="ocr-line ${b.id===block.id?'current':''}"><strong>${esc(b.location)} · 점수 ${Number.isFinite(b.confidence)?Math.round(b.confidence):'미확인'}</strong><p>${b.words?.length?b.words.map(w=>`<span class="${w.confidence===null||w.confidence<75?'ocr-unknown':''}" title="점수 ${w.confidence??'없음'}">${esc(w.text)}</span>`).join(' '):esc(b.text)}</p><p>${b.uncertain?'미확인 — 낮은 점수·점수 없음':'인식 결과 — 원문 검토 필요'}</p></article>`).join('')||'<p>미확인 — OCR 내용 없음</p>'}</div></div>`;$('#ocr-compare').showModal();}
$('#close-ocr').addEventListener('click',()=>$('#ocr-compare').close());
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b?.dataset.compareFile)return;const doc=state.imports.find(d=>d.id===b.dataset.compareFile),block=b.dataset.comparePage?{page:Number(b.dataset.comparePage),id:'',bbox:null}:doc?.blocks.find(x=>x.id===b.dataset.compareBlock);if(doc&&block)compareOCR(doc,block);});
$('#ocr-environment').textContent=window.location?.protocol==='file:'?'OCR을 사용하려면 프로젝트 폴더의 ‘로컬 실행.cmd’를 실행하세요. 기존 작성본은 JSON 백업으로 새 미리보기에 옮깁니다.':'한국어·영어 OCR을 이 컴퓨터에서 처리합니다. 텍스트 없는 페이지는 자동 OCR하며 원본 렌더링도 보관합니다.';
function renderImports(){const target=window.PlanningDraft.requirements(C,state.selected).find(r=>r.id===$('#file-target').value),query=$('#file-search').value||'';$('#upload-results').innerHTML=state.imports.length?state.imports.map(doc=>{const blocks=doc.blocks.map(b=>({...b,score:window.PlanningFiles.rank(b,target,query)})).filter(b=>!query||b.score>0).sort((a,b)=>b.score-a.score);return `<details class="file-document" open><summary>${esc(doc.name)} · ${doc.blocks.length}개 추출</summary><p>파일 식별값 SHA-256: <code>${esc(doc.sha256)}</code></p>${(doc.pages||[]).map(p=>`<button data-compare-file="${esc(doc.id)}" data-compare-page="${p.number}">${p.number}페이지 원본·OCR 대조</button><p>${esc(p.status)}</p>`).join('')}${doc.issues.map(i=>`<p class="file-warning">미확인·주의: ${esc(i)}</p>`).join('')}<p>검색 결과 ${blocks.length}개 중 최대 50개 표시. 원문 단어로 좁혀보세요. 추천 순서는 단어 일치일 뿐 의미가 맞는다는 판정이 아닙니다.</p>${blocks.slice(0,50).map(b=>`<article class="extract-block"><strong>${esc(b.location)}</strong><pre>${esc(b.text)}</pre>${b.method==='ocr'?`<p>OCR 점수: ${Number.isFinite(b.confidence)?Math.round(b.confidence):'미확인'} · 원문 검토 필요</p><button data-compare-file="${esc(doc.id)}" data-compare-block="${esc(b.id)}">원본 페이지와 대조</button>`:''}${b.uncertain?`<p class="file-warning">미확인: ${esc(b.reasons.join(' · '))}</p>`:''}<button data-attach-file="${esc(doc.id)}" data-attach-block="${esc(b.id)}" ${target?'':'disabled'}>선택 데이터에 반영</button></article>`).join('')}</details>`;}).join(''):'<p>아직 추출한 파일이 없습니다.</p>';}
$('#file-target').addEventListener('change',renderImports);$('#file-search').addEventListener('input',renderImports);
$('#source-files').addEventListener('change',async e=>{const files=[...e.target.files];if(!files.length)return;e.target.disabled=true;$('#reset').disabled=true;$('#import-button').disabled=true;let count=0;const failures=[];try{for(const file of files){$('#upload-status').textContent=file.name+' 읽는 중…';try{const doc=await window.PlanningFiles.extract(file,{ocrMode:$('#ocr-mode').value||'auto',ocrLanguage:$('#ocr-language').value||'kor',progress:msg=>$('#upload-status').textContent=file.name+' / '+msg});const prior=state.imports.findIndex(d=>d.sha256===doc.sha256);if(prior>=0){state.imports[prior]=doc;}else{if(state.imports.length>=5){failures.push('최대 5개 파일까지 보관합니다.');continue;}state.imports.push(doc);}count++;save();}catch(err){failures.push(file.name+': '+(err.message||'읽기 실패 — 미확인'));}}renderImports();$('#upload-status').textContent=`${count}개 파일 추출 완료. `+(failures.join(' / ')||'추출 위치·내용을 검토해 데이터에 반영하세요.');}finally{e.target.value='';e.target.disabled=false;$('#reset').disabled=false;$('#import-button').disabled=false;}});
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b?.dataset.attachFile)return;const doc=state.imports.find(d=>d.id===b.dataset.attachFile),block=doc?.blocks.find(x=>x.id===b.dataset.attachBlock),key=$('#file-target').value;if(!block||!key)return;try{state.materials[key]=window.PlanningFiles.attach(state.materials[key],doc,block);save();collection();$('#upload-status').textContent=key+'에 반영했습니다. 기준 기간·자료 성격과 원문 검토를 확인하세요.';}catch(err){$('#upload-status').textContent=err.message;}});
function download(content,type,ext,title=state.common.title){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([content],{type}));a.href=url;const base=(title||'프로젝트-기획').replace(/[<>:"/\\|?*\x00-\x1f]/g,'-').slice(0,80);a.download=base+ext;document.body.append(a);a.click();try{window.PlanningInsights?.trackDownload(ext);}catch{}a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('#presets').innerHTML=C.presets.map((p,i)=>`<button data-preset="${i}">${esc(p.name)} ＋</button>`).join('');
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.view){active=b.dataset.view;document.querySelectorAll('[data-view]').forEach(el=>{el.setAttribute('aria-pressed',String(el.dataset.view===active));if(el.classList?.contains('tree-link'))el.classList.toggle('active',el.dataset.view===active);});cards();detail();}
 if(b.dataset.axis){axis=b.dataset.axis;tree();}
 if(b.dataset.facet!==undefined){filters[b.dataset.facetAxis]=b.dataset.facet;$('#filter-'+b.dataset.facetAxis).value=b.dataset.facet;tree();cards();detail();}
 if(b.dataset.add){state.selected=[...new Set([...state.selected,b.dataset.add])];save();detail();composer();}
 if(b.dataset.remove){state.selected=state.selected.filter(x=>x!==b.dataset.remove);save();detail();composer();}
 if(b.dataset.preset!==undefined){state.selected=[...new Set([...state.selected,...C.presets[Number(b.dataset.preset)].ids])];save();detail();composer();$('#composer').scrollIntoView({behavior:'smooth',block:'start'});}
});
$('#search').addEventListener('input',e=>{filter=e.target.value;cards();detail();});
for(const k of Object.keys(filters)){
 const el=$('#filter-'+k);el.innerHTML='<option value="">전체</option>'+C.facets[k].map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('');
 el.addEventListener('change',e=>{filters[k]=e.target.value;tree();cards();detail();});
}
$('#clear-filters').addEventListener('click',()=>{filter='';$('#search').value='';for(const k of Object.keys(filters)){filters[k]='';$('#filter-'+k).value='';}tree();cards();detail();});
document.addEventListener('input',e=>{const t=e.target;materialInput(t);if(t.dataset.reference){state.references[t.dataset.reference]=t.value;save();}if(t.dataset.common){state.common[t.dataset.common]=t.value;save();}if(t.dataset.module){const id=t.dataset.module,q=byId(id).questions[Number(t.dataset.question)];state.answers[id]??={};state.answers[id][q]=t.value;save();}});
document.addEventListener('change',e=>{materialInput(e.target);if(e.target.dataset.review){const id=e.target.dataset.review;state.materials[id].reviewed=e.target.checked;$('#status-'+id).textContent=window.PlanningDraft.status(state.materials[id]);save();}if(e.target.dataset.check!==undefined){state.checks[Number(e.target.dataset.check)]=e.target.checked;save();}});
$('#generate-draft').addEventListener('click',()=>{$('#draft-preview').textContent=exportMarkdown();$('#draft-status').textContent='현재 입력 자료로 생성한 초안입니다. 미확인 항목과 근거 적합성을 검토하세요.';});
$('#export-md').addEventListener('click',()=>download(exportMarkdown(),'text/markdown;charset=utf-8','.md'));
async function exportDocument(format){
 if(!state.selected.length){$('#export-status').textContent='먼저 내 기획에 기획을 하나 이상 추가하세요.';return;}
 const buttons=[$('#export-docx'),$('#export-pdf')];buttons.forEach(b=>b.disabled=true);
 const title=state.common.title||'프로젝트-기획';
 try{
  $('#export-status').textContent=(format==='pdf'?'PDF':'워드')+' 파일 만드는 중…';
  const markdown=exportMarkdown();$('#draft-preview').textContent=markdown;
  $('#draft-status').textContent='다운로드와 같은 내용의 초안입니다. 미확인 항목과 근거 적합성을 검토하세요.';
  // Snapshot all content before the asynchronous PDF layout begins.
  const m=window.PlanningExport.model(markdown),data=format==='pdf'?await window.PlanningExport.pdf(m):window.PlanningExport.docx(m);
  download(data,format==='pdf'?'application/pdf':'application/vnd.openxmlformats-officedocument.wordprocessingml.document','.'+format,title);
  $('#export-status').textContent='파일을 만들고 다운로드를 요청했습니다. 브라우저의 다운로드 목록을 확인하세요. 수치·출처·미확인 표시는 초안과 같습니다.';
 }catch(e){$('#export-status').textContent='내려받기 실패: '+(e.message||'파일을 만들지 못했습니다. 다시 시도하세요.');}
 finally{buttons.forEach(b=>b.disabled=false);}
}
$('#export-docx').addEventListener('click',()=>exportDocument('docx'));
$('#export-pdf').addEventListener('click',()=>exportDocument('pdf'));
$('#export-json').addEventListener('click',()=>download(JSON.stringify(state,null,2),'application/json;charset=utf-8','.json'));
$('#load-demo').addEventListener('click',async()=>{
 const button=$('#load-demo');button.disabled=true;
 try{
  if(state.selected.length||Object.values(state.common).some(Boolean)||Object.keys(state.materials).length||state.imports.length||Object.keys(state.answers).length){if(!confirm('현재 작성 내용을 가상 호텔 예시로 바꿉니다. 필요한 내용은 먼저 JSON으로 백업하세요. 계속할까요?'))return;}
  const url=window.location?.protocol==='file:'?'../examples/material-draft-demo.json':'demo.json';
  const response=await fetch(url);if(!response.ok)throw Error('예시 파일을 읽지 못했습니다.');
  const next=normalize(await response.json());state=next;fillCommon();refresh();save();
  $('#draft-preview').textContent=exportMarkdown();$('#draft-status').textContent='가상 자료로 만든 연습용 초안입니다. 실제 현장 근거가 아니며 미확인 상태를 유지합니다.';
  $('#demo-status').textContent='가상 호텔 예시를 불러왔습니다. 아래에서 초안을 검토하고 워드·PDF로 내려받으세요.';
  $('#composer').scrollIntoView({behavior:'smooth',block:'start'});
 }catch(e){$('#demo-status').textContent='예시 불러오기 실패 — 웹 주소로 접속하거나 examples/material-draft-demo.json을 백업 불러오기로 선택하세요.';}
 finally{button.disabled=false;}
});
$('#import-button').addEventListener('click',()=>$('#import-file').click());
$('#import-file').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>30*1024*1024)throw new Error('30MB 이하의 백업을 선택하세요.');const next=normalize(JSON.parse(await f.text()));if(confirm('현재 작성 내용을 백업으로 바꿉니다. 필요한 내용은 먼저 JSON으로 저장하세요. 계속할까요?')){state=next;fillCommon();refresh();save();}}catch(err){alert('불러오기 실패: '+err.message);}finally{e.target.value='';}});
$('#reset').addEventListener('click',()=>{if(confirm('이 브라우저의 현재 작성 내용을 초기화할까요? 필요한 내용은 먼저 JSON으로 백업하세요.')){state=blank();fillCommon();refresh();save();}});
fillCommon();refresh();
window.PlanningApp={normalize,exportMarkdown,getState:()=>JSON.parse(JSON.stringify(state)),getResults:()=>C.types.filter(matches).map(t=>t.id)};
