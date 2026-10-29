'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),{DatabaseSync}=require('node:sqlite');
const {createTracker}=require('../prototype/insights.js');
(async()=>{
 const source=fs.readFileSync('services/insights/worker/index.js','utf8'),{createHandler}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const sqlite=new DatabaseSync(':memory:');sqlite.exec(fs.readFileSync('services/insights/drizzle/0000_insights.sql','utf8'));
 const DB={prepare(sql){let params=[];const statement={bind(...p){params=p;return statement;},async first(){return sqlite.prepare(sql).get(...params)||null;},async all(){return {results:sqlite.prepare(sql).all(...params)};},async run(){return sqlite.prepare(sql).run(...params);}};return statement;},async batch(items){const result=[];for(const s of items)result.push(await s.run());return result;}};
 let time=1793246400000;const worker=createHandler(()=>time),env={DB,ADMIN_EMAIL:'owner@example.test',FEEDBACK_ENABLED:'true'};
 const client=crypto.randomUUID(),origin='https://ideapt.github.io',host='https://test.example';
 async function post(path,body,sourceOrigin=origin){return worker.fetch(new Request(host+path,{method:'POST',headers:{Origin:sourceOrigin,'Content-Type':'application/json'},body:JSON.stringify(body)}),env);}
 async function ticket(action='event'){const r=await post('/api/ticket',{client,action});assert.equal(r.status,200);return (await r.json()).ticket;}
 assert.equal((await post('/api/ticket',{client,action:'event'},'https://untrusted.example')).status,403);
 assert.equal((await worker.fetch(new Request(host+'/api/admin'),env)).status,403);
 assert.equal((await worker.fetch(new Request(host+'/api/admin',{headers:{'oai-authenticated-user-id':'other'}}),env)).status,403);
 const id=crypto.randomUUID(),t=await ticket();const body={client,ticket:t,id,kind:'visit'};assert.equal((await post('/api/event',body)).status,200);assert.equal((await post('/api/event',body)).status,403);
 assert.equal((await post('/api/event',{client,ticket:await ticket(),id:crypto.randomUUID(),kind:'pdf',title:'기획서 원문은 허용하지 않음'})).status,400);
 assert.equal((await post('/api/event',{...body,ticket:await ticket()})).status,200);assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM events').get().n,1);
 assert.equal((await post('/api/event',{client,ticket:await ticket(),id:crypto.randomUUID(),kind:'pdf'})).status,200);
 const feedback={client,ticket:await ticket('feedback'),rating:4,category:'feature',message:'가상 시험 의견 <script>alert(1)</script>',consent:false,website:''};
 assert.equal((await post('/api/feedback',feedback)).status,400);assert.equal((await post('/api/feedback',{...feedback,consent:true})).status,200);
 const admin=await worker.fetch(new Request(host+'/api/admin',{headers:{'oai-authenticated-user-id':'owner','oai-authenticated-user-email':'owner@example.test'}}),env);const stats=await admin.json();assert.equal(stats.daily[0].visitors,1);assert.equal(stats.daily[0].pdf,1);assert.equal(stats.feedback.length,1);assert.equal(stats.ratings.average,4);
 const disabled=await worker.fetch(new Request(host+'/api/feedback',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({...feedback,consent:true})}),{...env,FEEDBACK_ENABLED:'false'});assert.equal(disabled.status,403);
 const memory=new Map(),sent=[];const storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)};
 const fetcher=async(url,options)=>{sent.push(JSON.parse(options.body));return worker.fetch(new Request(url,options),env);};
 // Network test adapter adds the browser-managed Origin header.
 const browserFetch=async(url,options)=>fetcher(url,{...options,headers:{...options.headers,Origin:origin}});
 const tracker=createTracker({storage,fetcher:browserFetch,uuid:()=>crypto.randomUUID(),now:()=>time,enabled:true});
 assert.equal(await tracker.visit(),false);assert.equal(sent.length,0);tracker.setConsent(true);assert.equal(await tracker.visit(),true);assert.equal(await tracker.visit(),false);
 const count=sent.length;assert.equal(await tracker.download('.json'),false);assert.equal(sent.length,count);assert.equal(await tracker.download('.docx'),true);
 tracker.setConsent(false);assert.equal(await tracker.download('.pdf'),false);for(const b of sent)assert(!('title'in b)&&!('content'in b)&&!('filename'in b));
 assert(!source.includes('innerHTML'));sqlite.close();console.log('통계·의견 검사 통과: 동의 전 미전송·거부·세션 중복·형식별 집계·원문 제외·일회 제출권·출처·운영자 권한·의견 동의·저장');
})().catch(e=>{console.error(e);process.exitCode=1;});
