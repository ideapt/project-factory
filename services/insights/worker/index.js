const APP_ORIGIN='https://ideapt.github.io';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const kinds=['visit','docx','pdf','md'];
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createHandler(clock=()=>Date.now()){
 return {async fetch(request,env){
  const url=new URL(request.url),origin=request.headers.get('Origin'),cors=origin===APP_ORIGIN||origin===url.origin;
  const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Vary':'Origin'};
  if(cors){headers['Access-Control-Allow-Origin']=origin;headers['Access-Control-Allow-Headers']='Content-Type';headers['Access-Control-Allow-Methods']='POST, GET, OPTIONS';}
  const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{...headers,'Content-Type':'application/json; charset=utf-8'}});
  const page=(body,status=200)=>new Response(body,{status,headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"}});
  const admin=Boolean(env.ADMIN_EMAIL)&&request.headers.get('oai-authenticated-user-id')&&request.headers.get('oai-authenticated-user-email')?.toLowerCase()===env.ADMIN_EMAIL.toLowerCase();
  try{
   if(request.method==='OPTIONS')return cors?new Response(null,{status:204,headers}):json({error:'허용되지 않은 출처입니다.'},403);
   if(url.pathname==='/'||url.pathname==='/admin'){
    if(!admin)return page(shell('<h1>프로젝트 공장 운영 통계</h1><p>평가·개선 의견과 통계는 운영자만 확인할 수 있습니다.</p><a target="_top" href="/signin-with-chatgpt?return_to=%2Fadmin">ChatGPT로 운영자 로그인</a><p><a href="https://ideapt.github.io/project-factory/">기획 도구로 돌아가기</a></p>'));
    return page(adminPage());
   }
   if(url.pathname==='/api/health'){
    if(!env.DB)return json({ready:false},503);
    const row=await env.DB.prepare("SELECT COUNT(*) AS count FROM sqlite_master WHERE type='table' AND name IN ('events','feedback','tickets','limits')").first();
    return json({ready:row.count===4},row.count===4?200:503);
   }
   if(url.pathname==='/api/admin'){
    if(!admin)return json({error:'운영자 로그인이 필요합니다.'},403);
    const cutoff=clock()-90*86400000,isTest=url.searchParams.get('scope')==='test'?1:0,isOperator=!isTest&&url.searchParams.get('scope')==='operator'?1:0;
    const daily=await env.DB.prepare("SELECT day, COUNT(DISTINCT CASE WHEN kind='visit' THEN visitor END) AS visitors, SUM(kind='visit') AS visits, SUM(kind='docx') AS docx, SUM(kind='pdf') AS pdf, SUM(kind='md') AS md FROM events WHERE created>=? AND is_test=? AND is_operator=? GROUP BY day ORDER BY day DESC").bind(cutoff,isTest,isOperator).all();
    const feedback=await env.DB.prepare('SELECT id, day, rating, category, message, created FROM feedback WHERE is_test=? AND is_operator=? ORDER BY created DESC LIMIT 200').bind(isTest,isOperator).all();
    const ratings=await env.DB.prepare('SELECT COUNT(*) AS total, COUNT(rating) AS rated, AVG(rating) AS average FROM feedback WHERE is_test=? AND is_operator=?').bind(isTest,isOperator).first();
    return json({scope:isTest?'test':isOperator?'operator':'real',daily:daily.results,feedback:feedback.results,ratings,windowDays:90,feedbackLimit:200});
   }
   if(request.method!=='POST'||!['/api/ticket','/api/event','/api/feedback'].includes(url.pathname))return json({error:'찾을 수 없습니다.'},404);
   if(!cors)return json({error:'허용되지 않은 출처입니다.'},403);
   if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'JSON 요청이 필요합니다.'},415);
   if(Number(request.headers.get('Content-Length'))>12000)return json({error:'요청이 너무 큽니다.'},413);
   const raw=await request.text();if(raw.length>6000)return json({error:'요청이 너무 큽니다.'},413);
   let data;try{data=JSON.parse(raw);}catch{return json({error:'입력을 읽지 못했습니다.'},400);}
   if(!data||typeof data!=='object'||Array.isArray(data)||!UUID.test(data.client||''))return json({error:'잘못된 익명 식별값입니다.'},400);
   const now=clock(),day=new Date(now+9*3600000).toISOString().slice(0,10);
   const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(day+'|'+data.client));const visitor=Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');
   if(!env.DB)return json({error:'저장 기능을 준비 중입니다.'},503);
   if(url.pathname==='/api/ticket'){
    if(Object.keys(data).some(k=>!['client','action','test','operator'].includes(k))||!['event','feedback'].includes(data.action))return json({error:'잘못된 요청입니다.'},400);
    if((data.test!==undefined&&typeof data.test!=='boolean')||(data.operator!==undefined&&typeof data.operator!=='boolean'))return json({error:'잘못된 시험 구분입니다.'},400);
    const key=day+'|ticket|'+visitor;
    const limited=await env.DB.prepare('INSERT INTO limits(key,amount) VALUES(?,1) ON CONFLICT(key) DO UPDATE SET amount=amount+1 RETURNING amount').bind(key).first();
    if(limited.amount>150)return json({error:'오늘 요청이 많습니다. 나중에 다시 시도하세요.'},429);
    const ticket=crypto.randomUUID();await env.DB.batch([env.DB.prepare('DELETE FROM tickets WHERE expires<?').bind(now),env.DB.prepare('INSERT INTO tickets(id,visitor,action,expires,is_test,is_operator) VALUES(?,?,?,?,?,?)').bind(ticket,visitor,data.action,now+300000,data.test===true?1:0,data.test!==true&&data.operator===true?1:0)]);
    return json({ticket});
   }
   const action=url.pathname==='/api/event'?'event':'feedback';
   if(action==='feedback'&&env.FEEDBACK_ENABLED!=='true')return json({error:'의견 수집은 아직 활성화되지 않았습니다.'},403);
   const allowed=action==='event'?['client','ticket','id','kind']:['client','ticket','rating','category','message','consent','website'];
   if(Object.keys(data).some(k=>!allowed.includes(k)))return json({error:'허용되지 않은 입력 항목입니다.'},400);
   if(action==='event'&&(!UUID.test(data.id||'')||!kinds.includes(data.kind)))return json({error:'잘못된 집계 항목입니다.'},400);
   if(action==='feedback'&&(data.consent!==true||data.website||!['general','problem','feature'].includes(data.category)||typeof data.message!=='string'||data.message.length>2000||!(data.rating===null||Number.isInteger(data.rating)&&data.rating>=1&&data.rating<=5)||(!data.rating&&data.message.trim().length<2)))return json({error:'평가·의견과 제출 동의를 확인하세요.'},400);
   const used=await env.DB.prepare('DELETE FROM tickets WHERE id=? AND visitor=? AND action=? AND expires>=? RETURNING id,is_test,is_operator').bind(data.ticket||'',visitor,action,now).first();
   if(!used)return json({error:'제출권이 만료됐습니다. 다시 제출하세요.'},403);
   if(action==='event'){
    await env.DB.batch([env.DB.prepare('INSERT OR IGNORE INTO events(id,day,visitor,kind,created,is_test,is_operator) VALUES(?,?,?,?,?,?,?)').bind(data.id,day,visitor,data.kind,now,used.is_test,used.is_operator),env.DB.prepare('DELETE FROM events WHERE created<?').bind(now-90*86400000),env.DB.prepare('DELETE FROM limits WHERE key<?').bind(new Date(now-86400000).toISOString().slice(0,10))]);
    return json({ok:true});
   }
   const key=day+'|feedback|'+visitor;
   const limit=await env.DB.prepare('INSERT INTO limits(key,amount) VALUES(?,1) ON CONFLICT(key) DO UPDATE SET amount=amount+1 RETURNING amount').bind(key).first();
   if(limit.amount>3)return json({error:'하루 최대 3개의 의견을 보낼 수 있습니다.'},429);
   const id=crypto.randomUUID();await env.DB.prepare('INSERT INTO feedback(id,day,visitor,rating,category,message,created,is_test,is_operator) VALUES(?,?,?,?,?,?,?,?,?)').bind(id,day,visitor,data.rating,data.category,data.message.trim(),now,used.is_test,used.is_operator).run();
   return json({ok:true,id});
  }catch{return json({error:'저장 서비스에 연결하지 못했습니다. 잠시 뒤 다시 시도하세요.'},503);}
 }};
}
function shell(body){return '<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>프로젝트 공장 운영 통계</title><style>body{font:16px/1.7 system-ui,sans-serif;max-width:1100px;margin:40px auto;padding:20px;color:#173d48;background:#f6f8f5}table{border-collapse:collapse;width:100%;background:white}td,th{border:1px solid #ccd8d5;padding:10px;text-align:left}article{background:white;padding:20px;margin:14px 0;border-radius:12px}pre{white-space:pre-wrap;overflow-wrap:anywhere}a,button{color:#285b49}h1{font-size:26px}</style>'+body+'</html>';}
function adminPage(){return shell(`<h1>프로젝트 공장 운영 통계·사용 의견</h1><p>익명 통계 참여자 기준 · 최근 90일 · 한국시간 날짜 · 다운로드는 저장 요청 횟수입니다. 사람 수나 파일 열람을 인증하지 않습니다.</p><p id="status">불러오는 중…</p><label>조회 구분 <select id="scope"><option value="real">일반 사용자</option><option value="operator">운영자</option><option value="test">시험 기록</option></select></label><button id="refresh">새로고침</button><p>운영자·시험 기록은 일반 사용자 통계·평점에서 제외합니다. 운영자 구분은 브라우저 지정 기준이며 로그인 권한과 별개입니다. 일반 사용자 기록도 사람 여부를 인증하지 않습니다.</p><p><a href="https://ideapt.github.io/project-factory/?insights=operator#metrics-title" target="_blank" rel="noopener">이 브라우저를 운영자용으로 지정하고 기획 도구 열기</a></p><p>브라우저마다 한 번 지정하세요. 저장소를 지우면 다시 지정해야 합니다. 시험 주소에서는 시험 구분이 우선합니다.</p><h2>일별 이용</h2><table><thead><tr><th>날짜</th><th>고유 브라우저</th><th>방문 세션</th><th>워드</th><th>PDF</th><th>Markdown</th></tr></thead><tbody id="daily"></tbody></table><h2>평가·개선 의견</h2><p id="ratings"></p><p>최신 200개 표시. 의견은 이 운영 화면에서만 확인합니다.</p><div id="feedback"></div><script>
const el=id=>document.getElementById(id);const cell=value=>{const td=document.createElement('td');td.textContent=String(value??0);return td};
let requestNumber=0;async function load(){const current=++requestNumber;try{const r=await fetch('/api/admin?scope='+el('scope').value,{cache:'no-store'});if(!r.ok)throw Error('운영자 로그인 또는 연결 상태를 확인하세요.');const d=await r.json();if(current!==requestNumber)return;el('daily').replaceChildren();for(const row of d.daily){const tr=document.createElement('tr');for(const k of ['day','visitors','visits','docx','pdf','md'])tr.append(cell(row[k]));el('daily').append(tr)}el('status').textContent=d.daily.length?'집계한 날짜 '+d.daily.length+'일':'아직 수집한 통계가 없습니다. 과거 이용량은 소급 집계하지 않습니다.';el('ratings').textContent='의견 '+d.ratings.total+'건 · 평점 '+d.ratings.rated+'건 · 평균 '+(d.ratings.average===null?'아직 없음':Number(d.ratings.average).toFixed(2)+'/5');el('feedback').replaceChildren();for(const f of d.feedback){const article=document.createElement('article'),h=document.createElement('strong'),p=document.createElement('pre');h.textContent=f.day+' · '+(f.rating?f.rating+'/5':'평점 없음')+' · '+f.category;p.textContent=f.message;article.append(h,p);el('feedback').append(article)}}catch(e){if(current===requestNumber)el('status').textContent=e.message}}el('refresh').onclick=load;el('scope').onchange=load;load();</script>`);}
export default createHandler();
