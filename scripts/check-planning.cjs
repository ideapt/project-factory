'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),C=require('../prototype/catalog.js');
assert.equal(C.groups.length,9);assert.equal(C.types.length,63);
assert.equal(new Set(C.types.map(t=>t.id)).size,63);
for(const [key,values]of Object.entries(C.facets)){
 assert.equal(new Set(values.map(v=>v.id)).size,values.length);
 for(const t of C.types){assert(t[key].length);for(const id of t[key])assert(values.some(v=>v.id===id),`${t.id}: ${key}/${id}`);}
}
for(const t of C.types){assert(C.groups.some(g=>g.id===t.group));assert.equal(t.questions.length,4);assert(t.data.length&&t.metrics.length&&t.gate&&t.outputs.length);const text=fs.readFileSync(path.join(root,'templates/catalog',t.id+'.md'),'utf8');for(const q of t.questions)assert(text.includes(q));}
for(const p of C.presets){assert(p.ids.length>1);for(const id of p.ids)assert(C.types.some(t=>t.id===id));}
const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>['.git','node_modules'].includes(e.name)?[]:e.isDirectory()?walk(path.join(p,e.name)):[path.join(p,e.name)]);
const files=walk(root);let links=0;
for(const f of files.filter(f=>f.endsWith('.md'))){const s=fs.readFileSync(f,'utf8');assert(!s.includes('\ufffd'),`인코딩: ${f}`);for(const m of s.matchAll(/\]\(([^)]+)\)/g)){if(/^(https?:|#)/.test(m[1]))continue;const link=decodeURIComponent(m[1].split('#')[0]);assert(fs.existsSync(path.resolve(path.dirname(f),link)),`링크 오류 ${f}: ${link}`);links++;}}
// 브라우저 API를 흉내 내는 최소 입력 환경에서 선택·복원·내보내기 논리를 확인합니다.
const nodes=new Map(),events={};const node=key=>nodes.get(key)||nodes.set(key,{value:'',dataset:{},innerHTML:'',textContent:'',disabled:false,addEventListener:(type,fn)=>events[key+':'+type]=fn,scrollIntoView(){}}).get(key);
const stored=new Map();const context={window:{PlanningCatalog:C,PlanningDraft:require('../prototype/draft-engine.js'),PlanningFiles:require('../prototype/file-reader.js')},document:{querySelector:node,querySelectorAll:()=>[],addEventListener:(type,fn)=>events['doc:'+type]=fn},localStorage:{getItem:k=>stored.get(k),setItem:(k,v)=>stored.set(k,v)},console,confirm:()=>true,alert:()=>{},Blob,URL,setTimeout};
vm.runInNewContext(fs.readFileSync(path.join(root,'prototype/app.js'),'utf8'),context);
const app=context.window.PlanningApp;
const click=dataset=>events['doc:click']({target:{closest:()=>({dataset})}});
click({preset:'0'});assert.equal(app.getState().selected.length,6);click({preset:'0'});assert.equal(app.getState().selected.length,6);
events['doc:input']({target:{dataset:{common:'title'},value:'시험용 통합 제목'}});
events['doc:input']({target:{dataset:{module:'hotel-feasibility',question:'0'},value:'근거 E-01, 미확인 범위 유지'}});
let md=app.exportMarkdown();assert(md.includes('시험용 통합 제목'));assert(md.includes('근거 E-01, 미확인 범위 유지'));assert.equal((md.match(/## 공통 기획/g)||[]).length,1);assert(md.includes('미확인'));assert(md.includes('호텔 사업 타당성'));
click({remove:'hotel-feasibility'});assert(!app.exportMarkdown().includes('근거 E-01, 미확인 범위 유지'));click({add:'hotel-feasibility'});assert(app.exportMarkdown().includes('근거 E-01, 미확인 범위 유지'));
assert.throws(()=>app.normalize({version:'0.1'}));const roundtrip=app.normalize(JSON.parse(JSON.stringify(app.getState())));assert.equal(roundtrip.common.title,'시험용 통합 제목');roundtrip.selected.push('unknown','site','site');const clean=app.normalize(roundtrip);assert(!clean.selected.includes('unknown'));assert.equal(clean.selected.filter(x=>x==='site').length,1);
events['doc:input']({target:{dataset:{material:'E-hotel-feasibility-1',materialField:'content'},value:'자료 저장 시험'}});
events['doc:input']({target:{dataset:{reference:'common:context'},value:'E-hotel-feasibility-1'}});
const savedMaterials=app.normalize(JSON.parse(JSON.stringify(app.getState())));assert.equal(savedMaterials.materials['E-hotel-feasibility-1'].content,'자료 저장 시험');assert.equal(savedMaterials.references['common:context'],'E-hotel-feasibility-1');
const old04={...JSON.parse(JSON.stringify(app.getState())),version:'0.4.0'};delete old04.materials;delete old04.references;assert.equal(app.normalize(old04).version,C.version);assert.equal(Object.keys(app.normalize(old04).materials).length,0);
const restoredOCR={...JSON.parse(JSON.stringify(app.getState())),version:'0.6.0',imports:[{id:'F-test',name:'scan.pdf',sha256:'a'.repeat(64),kind:'pdf',pages:[{number:1,width:100,height:200,image:'data:image/jpeg;base64,YQ==',status:'OCR 검토 필요'}],issues:[],blocks:[{id:'B-test',text:'20',location:'PDF 1페이지 OCR',method:'ocr',page:1,confidence:60,uncertain:true,bbox:{x0:1,y0:2,x1:3,y1:4},words:[{text:'20',confidence:60}]}]}]};const parsedOCR=app.normalize(restoredOCR);assert.equal(parsedOCR.imports[0].pages[0].number,1);assert.equal(parsedOCR.imports[0].blocks[0].confidence,60);assert(parsedOCR.imports[0].blocks[0].uncertain);
const legacy=JSON.parse(JSON.stringify(app.getState()));legacy.version='0.3.0';const migrated=app.normalize(legacy);assert.equal(migrated.version,C.version);assert.equal(migrated.common.title,'시험용 통합 제목');assert.equal(migrated.answers['hotel-feasibility'][C.types.find(t=>t.id==='hotel-feasibility').questions[0]],'근거 E-01, 미확인 범위 유지');
events['#filter-roles:change']({target:{value:'hr'}});events['#filter-workplaces:change']({target:{value:'hotel'}});events['#filter-purposes:change']({target:{value:'operate'}});
assert(app.getResults().includes('shift'));assert(!app.getResults().includes('hotel-food'));assert(!app.getResults().includes('recruitment'));
const before=JSON.stringify(app.getState());click({axis:'workplaces'});assert.equal(JSON.stringify(app.getState()),before);
events['#search:input']({target:{value:'결과가없는검색어123'}});assert.equal(app.getResults().length,0);events['#clear-filters:click']();assert.equal(app.getResults().length,63);assert.equal(app.getState().common.title,'시험용 통합 제목');
events['doc:input']({target:{dataset:{module:'hotel-feasibility',question:'0'},value:'<script>alert(1)</script>'}});click({add:'cash'});assert(node('#module-forms').innerHTML.includes('&lt;script&gt;'));assert(!node('#module-forms').innerHTML.includes('<script>'));
console.log(`검증 통과: 3개 탐색 축, 16개 직무·8개 사업장·8개 목적, 63개 양식, 9개 조합, 내부 링크 ${links}개, 교차검색·조건 초기화·선택 보존·v0.3 복원·내보내기`);
// Exercise the actual download event handlers without browser-only save dialogs.
(async()=>{
 const exports=[];const exporter=require('../prototype/document-export.js');context.window.PlanningExport={...exporter,docx:m=>exporter.docx(m,require('fflate'))};context.recordDownload=(...args)=>exports.push(args);
 vm.runInNewContext('download=(...args)=>recordDownload(...args)',context);
 await events['#export-docx:click']();assert.equal(exports[0][2],'.docx');assert.equal(node('#draft-preview').textContent,app.exportMarkdown());assert(exports[0][0].length>1000);
 const sameState=JSON.stringify(app.getState());context.window.PlanningExport={...context.window.PlanningExport,pdf:async()=>{throw Error('가상 생성 실패');}};
 await events['#export-pdf:click']();assert(node('#export-status').textContent.includes('가상 생성 실패'));assert.equal(node('#export-pdf').disabled,false);assert.equal(JSON.stringify(app.getState()),sameState);
 vm.runInNewContext('state.selected=[]',context);const count=exports.length;await events['#export-docx:click']();assert.equal(exports.length,count);assert(node('#export-status').textContent.includes('먼저'));
 console.log('다운로드 연결 검사 통과: 현재 초안 일치·DOCX 생성·오류 안내·버튼 복구·빈 선택 안내·입력 보존');
})().catch(e=>{console.error(e);process.exitCode=1;});
