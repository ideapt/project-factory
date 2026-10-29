(function(root){
'use strict';
const SERVICE='https://project-factory-insights.iamyangheedong.chatgpt.site',KEY='project-factory-insights-v1';
function createTracker({storage,fetcher,uuid,now=()=>Date.now(),enabled=false}){
 let memory={};const read=()=>{try{return JSON.parse(storage.getItem(KEY)||'{}');}catch{return memory;}};
 const write=v=>{memory=v;try{storage.setItem(KEY,JSON.stringify(v));}catch{}};
 async function send(path,body){const r=await fetcher(SERVICE+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),credentials:'omit',cache:'no-store'});const data=await r.json();if(!r.ok)throw Error('통계를 전송하지 못했습니다.');return data;}
 async function event(kind,id){const s=read();if(!s.client){s.client=uuid();write(s);}const t=await send('/api/ticket',{client:s.client,action:'event'});await send('/api/event',{client:s.client,ticket:t.ticket,id,kind});}
 return {consent:()=>read().consent,setConsent:value=>{const s=read();s.consent=value===true;if(!value){delete s.client;delete s.visitAt;}write(s);},
  async visit(){if(!enabled||read().consent!==true)return false;const s=read();if(s.visitAt&&now()-s.visitAt<1800000)return false;await event('visit',uuid());const next=read();next.visitAt=now();write(next);return true;},
  async download(ext){if(!enabled||read().consent!==true)return false;const kind={'.docx':'docx','.pdf':'pdf','.md':'md'}[ext];if(!kind)return false;await event(kind,uuid());return true;}
 };
}
if(typeof module!=='undefined'&&module.exports){module.exports={createTracker,SERVICE,KEY};return;}
const $=s=>root.document.querySelector(s),tracker=createTracker({storage:root.localStorage,fetcher:root.fetch.bind(root),uuid:()=>root.crypto.randomUUID(),enabled:root.location.origin==='https://ideapt.github.io'&&root.location.pathname.startsWith('/project-factory/')});
function render(){$('#metrics-status').textContent=tracker.consent()===true?'익명 통계 참여 중입니다. 기획서 내용·제목·파일명은 보내지 않습니다.':tracker.consent()===false?'통계에 참여하지 않습니다. 기획 기능은 그대로 사용할 수 있습니다.':'익명 이용 통계는 선택 사항입니다. 동의 전에는 방문·다운로드 이벤트를 보내지 않습니다.';}
$('#metrics-allow').addEventListener('click',async()=>{tracker.setConsent(true);render();try{await tracker.visit();}catch{$('#metrics-status').textContent='통계 서버에 연결하지 못했습니다. 기획 기능은 계속 사용할 수 있습니다.';}});
$('#metrics-decline').addEventListener('click',()=>{tracker.setConsent(false);render();});
root.PlanningInsights={trackDownload:ext=>tracker.download(ext).catch(()=>{})};render();tracker.visit().catch(()=>{});
})(typeof globalThis!=='undefined'?globalThis:this);
