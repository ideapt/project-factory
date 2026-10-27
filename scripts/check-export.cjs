'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const E=require('../prototype/document-export.js'),zip=require('fflate'),Printer=require('pdfmake');
async function makePdf(m){const font=path.resolve('prototype/vendor/export/NanumGothic-Regular.ttf'),printer=new Printer({NanumGothic:{normal:font,bold:font,italics:font,bolditalics:font}});return new Promise((resolve,reject)=>{try{const doc=printer.createPdfKitDocument(E.pdfDefinition(m)),chunks=[];doc.on('data',b=>chunks.push(b));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject);doc.end();}catch(e){reject(e);}});}
async function main(){
 const md=fs.readFileSync('examples/draft-style-after.md','utf8')+'\n### 보존 시험\n\n- 금액: -1,234.50원 / 0.00%\n- 출처: https://example.com/source?a=1&b=2\n\n미확인 — 인식 점수 73.25 / PDF 2페이지 / 셀 B12 / <원문> & "인용"\n\n# 추가 입력 제목도 보존\n\n- 긴 내용: '+('긴 셀 내용 20개·30분 미확인 '.repeat(220))+'\n- 상태: 미확인\n';
 const m=E.model(md),bytes=E.docx(m,zip),files=zip.unzipSync(bytes),xml=zip.strFromU8(files['word/document.xml']);
 assert(xml.includes('<w:tbl>'));assert(xml.includes('w:anchor="section'));assert(xml.includes('목차'));assert(xml.includes('추가 입력 제목도 보존'));assert(xml.includes('https://example.com/source?a=1&amp;b=2'));assert(xml.includes('-1,234.50원 / 0.00%'));
 assert.throws(()=>E.docx(E.model('# 제목\n\n나쁜\u0001문자'),zip));
 // Every input line is retained (only Markdown heading/bullet presentation is removed).
 const plain=xml.match(/<w:t[^>]*>[\s\S]*?<\/w:t>/g).map(x=>x.replace(/^<w:t[^>]*>|<\/w:t>$/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&')).join('\n');
 for(const b of m.blocks)for(const s of b.kind==='table'?b.rows.flat():[b.text||''])assert(plain.includes(s),'DOCX 내용 누락: '+s.slice(0,70));
 const pdf=await makePdf(m);const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs');const task=pdfjs.getDocument({data:new Uint8Array(pdf),useSystemFonts:true,isEvalSupported:false}),doc=await task.promise;
 let text='';for(let i=1;i<=doc.numPages;i++){const page=await doc.getPage(i);text+=(await page.getTextContent()).items.filter(x=>x.transform[5]>40).map(x=>x.str).join('')+'\n';}
 const compact=s=>s.replace(/\s/g,'');for(const s of ['목차','근거 목록','파일 출처와 추출 상태','-1,234.50원 / 0.00%','73.25','PDF 2페이지','셀 B12','미확인','추가 입력 제목도 보존','https://example.com/source?a=1&b=2'])assert(compact(text).includes(compact(s)),'PDF 내용 누락: '+s);
 for(const b of m.blocks)for(const s of b.kind==='table'?b.rows.flat():[b.text||''])assert(compact(text).includes(compact(s)),'PDF 전체 내용 누락: '+s.slice(0,70));
 const sourceUnknown=(md.match(/미확인/g)||[]).length;assert((text.match(/미확인/g)||[]).length>=sourceUnknown);
 for(const n of new Set(md.match(/-?\d[\d,.]*(?:%|원|개|분)?/g)||[]))assert(compact(text).includes(n),'PDF 수치 누락: '+n);
 assert(doc.numPages>2);fs.mkdirSync('examples/export',{recursive:true});fs.writeFileSync('examples/export/synthetic-plan.docx',bytes);fs.writeFileSync('examples/export/synthetic-plan.pdf',pdf);
 const {createCanvas}=require('@napi-rs/canvas');const page=await doc.getPage(1),viewport=page.getViewport({scale:1.2}),canvas=createCanvas(Math.ceil(viewport.width),Math.ceil(viewport.height));await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;fs.writeFileSync('examples/export/preview.png',canvas.toBuffer('image/png'));
 const pages=doc.numPages;await task.destroy();console.log('내보내기 검증 통과: DOCX 전체 내용·표·목차 링크, PDF 한글·수치·출처·미확인 보존, '+pages+'페이지 긴 본문 생성');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
