'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),D=require('../prototype/draft-engine.js'),F=require('../prototype/file-reader.js'),C=require('../prototype/catalog.js');
global.ExcelJS=require('exceljs');global.fflate=require('fflate');
async function main(){
 const p='examples/upload-fixtures/synthetic-hotel.xlsx',b=fs.readFileSync(p);const doc=await F.extract({name:'synthetic-hotel.xlsx',size:b.length,arrayBuffer:async()=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)});
 assert(doc.sha256.length===64);assert(doc.blocks.some(x=>x.location.includes('B2')&&x.text.includes('20')));const formula=doc.blocks.find(x=>x.location.includes('B4'));assert(formula.uncertain);assert(formula.text.includes('미확인'));
 let e=F.attach({},doc,doc.blocks.find(x=>x.location.includes('B2')));assert.equal(e.traces.length,1);assert(!D.usable(e));e.kind='actual';e.period='2026-10';assert(!D.usable(e));e.reviewed=true;assert(D.usable(e));e=F.attach(e,doc,formula);assert(!D.usable(e));assert.equal(F.attach(e,doc,formula).traces.length,2);
 const state={selected:['hotel-housekeeping'],common:{},answers:{},references:{},checks:[],imports:[doc],materials:{'E-hotel-housekeeping-1':e}};const md=D.generate(C,state);assert(md.includes(doc.sha256));assert(md.includes("시트 '가상 운영'!B2"));assert(md.includes(formula.id));assert(md.includes('미확인 — 불확실한 파일 추출'));
 await assert.rejects(F.extract({name:'old.doc',size:1,arrayBuffer:async()=>new ArrayBuffer(0)}),/변환/);await assert.rejects(F.extract({name:'big.pdf',size:21*1024*1024}),/20MB/);
 // PDF API 호환성 회귀: 최신 PDFDocumentProxy에 destroy가 없어도 loadingTask로 정리합니다.
 let destroyed=false;global.pdfjsLib={getDocument:()=>({promise:Promise.resolve({numPages:2,getPage:async n=>({getTextContent:async()=>({items:n===1?[{str:'rooms 20',hasEOL:true}]:[]}),cleanup(){}})}),destroy:async()=>{destroyed=true;}})};
 const pdf=await F.extract({name:'test.pdf',size:1,arrayBuffer:async()=>new Uint8Array([1]).buffer});assert(destroyed);assert(pdf.blocks[0].location.includes('1페이지'));assert(pdf.issues.some(x=>x.includes('2페이지 텍스트 없음')));
 console.log('파일 검증 통과: 실제 XLSX 셀·수식, SHA-256·위치 추적, 검토/불확실 상태, 중복 채택, 크기·형식 제한, PDF 정리 API·빈 페이지');
}main().catch(e=>{console.error(e);process.exitCode=1;});
