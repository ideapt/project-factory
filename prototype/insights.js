(function(root){
'use strict';
const SERVICE='https://project-factory-insights.iamyangheedong.chatgpt.site',KEY='project-factory-insights-v1';
function createTracker({storage,fetcher,uuid,now=()=>Date.now(),enabled=false,testMode=false}){
 const storageKey=KEY+(testMode?'-test':'');let memory={};const read=()=>{try{return JSON.parse(storage.getItem(storageKey)||'{}');}catch{return memory;}};
 const write=v=>{memory=v;try{storage.setItem(storageKey,JSON.stringify(v));}catch{}};
 async function send(path,body){const r=await fetcher(SERVICE+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),credentials:'omit',cache:'no-store'});const data=await r.json();if(!r.ok)throw Error('통계를 전송하지 못했습니다.');return data;}
 async function event(kind,id){const s=read();if(!s.client){s.client=uuid();write(s);}const t=await send('/api/ticket',{client:s.client,action:'event',test:testMode});await send('/api/event',{client:s.client,ticket:t.ticket,id,kind});}
 return {consent:()=>read().consent,setConsent:value=>{const s=read();s.consent=value===true;if(!value){delete s.client;delete s.visitAt;}write(s);},
  async visit(){if(!enabled||read().consent!==true)return false;const s=read();if(s.visitAt&&now()-s.visitAt<1800000)return false;await event('visit',uuid());const next=read();next.visitAt=now();write(next);return true;},
  async feedback({rating=null,category='general',message='',consent=false,website=''}){if(!enabled)throw Error('공개 웹사이트에서 의견을 보낼 수 있습니다.');if(consent!==true)throw Error('전송 동의가 필요합니다.');const s=read();if(!s.client){s.client=uuid();write(s);}const t=await send('/api/ticket',{client:s.client,action:'feedback',test:testMode});return send('/api/feedback',{client:s.client,ticket:t.ticket,rating,category,message,consent:true,website});},
  async download(ext){if(!enabled||read().consent!==true)return false;const kind={'.docx':'docx','.pdf':'pdf','.md':'md'}[ext];if(!kind)return false;await event(kind,uuid());return true;}
 };
}
if(typeof module!=='undefined'&&module.exports){module.exports={createTracker,SERVICE,KEY};return;}
const testMode=new URLSearchParams(root.location.search).get('insights')==='test';
const $=s=>root.document.querySelector(s),tracker=createTracker({testMode,storage:root.localStorage,fetcher:root.fetch.bind(root),uuid:()=>root.crypto.randomUUID(),enabled:root.location.origin==='https://ideapt.github.io'&&root.location.pathname.startsWith('/project-factory/')});
$('#insights-test-banner').hidden=!testMode;
function render(){$('#metrics-status').textContent=tracker.consent()===true?'익명 통계 참여 중입니다. 기획서 내용·제목·파일명은 보내지 않습니다.':tracker.consent()===false?'통계에 참여하지 않습니다. 기획 기능은 그대로 사용할 수 있습니다.':'익명 이용 통계는 선택 사항입니다. 동의 전에는 방문·다운로드 이벤트를 보내지 않습니다.';}
$('#metrics-allow').addEventListener('click',async()=>{tracker.setConsent(true);render();try{await tracker.visit();}catch{$('#metrics-status').textContent='통계 서버에 연결하지 못했습니다. 기획 기능은 계속 사용할 수 있습니다.';}});
$('#metrics-decline').addEventListener('click',()=>{tracker.setConsent(false);render();});
$('#feedback-form').addEventListener('submit',async e=>{e.preventDefault();const form=e.currentTarget,status=$('#feedback-status'),button=$('#feedback-send');if(!form.reportValidity())return;const rating=$('#feedback-rating').value,message=$('#feedback-message').value.trim();if(!rating&&message.length<2){status.textContent='평점을 선택하거나 의견을 두 글자 이상 작성해 주세요.';return;}button.disabled=true;status.textContent='의견을 보내고 있습니다.';try{await tracker.feedback({rating:rating?Number(rating):null,category:$('#feedback-category').value,message,consent:$('#feedback-consent').checked,website:$('#feedback-website').value});form.reset();status.textContent=testMode?'시험 의견이 저장되었습니다. 실제 평가에서 제외됩니다.':'의견이 운영자에게 전달되었습니다. 감사합니다.';}catch{status.textContent='의견을 보내지 못했습니다. 작성 내용은 남아 있습니다. 잠시 후 다시 시도해 주세요. 하루에 세 번까지 보낼 수 있습니다.';}finally{button.disabled=false;}});
root.PlanningInsights={trackDownload:ext=>tracker.download(ext).catch(()=>{})};render();tracker.visit().catch(()=>{});
})(typeof globalThis!=='undefined'?globalThis:this);
