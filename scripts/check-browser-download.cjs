'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),E=require('../prototype/document-export'),z=require('fflate');
(async()=>{
 const dir='examples/export/',md=fs.readFileSync(dir+'browser-expected.md','utf8'),m=E.model(md),files=z.unzipSync(fs.readFileSync(dir+'browser-downloaded.docx'));
 const xml=z.strFromU8(files['word/document.xml']),unescape=s=>s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&');
 const word=[...xml.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)].map(x=>unescape(x[1])).join('\n');
 const sections=m.blocks.filter(b=>b.kind==='heading'&&b.level===2);for(const s of sections){assert(xml.includes('w:anchor="'+s.id+'"'));assert(xml.includes('w:name="'+s.id+'"'));}
 const tables=(xml.match(/<w:tbl>/g)||[]).length;assert(tables>=3);assert(z.strFromU8(files['word/footer1.xml']).includes('PAGE'));
 const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs'),task=pdfjs.getDocument({data:new Uint8Array(fs.readFileSync(dir+'browser-downloaded.pdf'))}),pdf=await task.promise;
 let text='',links=0;const {createCanvas}=require('@napi-rs/canvas');
 for(let i=1;i<=pdf.numPages;i++){const p=await pdf.getPage(i);text+=(await p.getTextContent()).items.filter(x=>x.transform[5]>40).map(x=>x.str).join('')+'\n';links+=(await p.getAnnotations()).filter(a=>a.subtype==='Link'&&a.dest).length;
  if(i===1||i===4){const viewport=p.getViewport({scale:1.1}),canvas=createCanvas(Math.ceil(viewport.width),Math.ceil(viewport.height));await p.render({canvasContext:canvas.getContext('2d'),viewport}).promise;fs.writeFileSync(dir+'browser-page-'+i+'.png',canvas.toBuffer('image/png'));}
 }
 const compact=s=>s.replace(/\s/g,'');for(const b of m.blocks)for(const s of b.kind==='table'?b.rows.flat():[b.text||'']){assert(word.includes(s),'워드 누락 '+s);assert(compact(text).includes(compact(s)),'PDF 누락 '+s);}
 assert(links>=sections.length);for(const value of ['-1,234.50','0.00%','2026-10-27','20개','30분','73.25','미확인','E-hotel-housekeeping-1','운영 시트 B12','https://example.com/source?a=1&b=2'])assert(compact(text).includes(compact(value))&&word.includes(value),value);
 const result={browser:'Codex in-app browser',testURL:'http://127.0.0.1:8872/prototype/',wordTables:tables,tocSections:sections.length,pdfPages:pdf.numPages,pdfInternalLinks:links,allModelTextPreserved:true,numbersAndUnknownPreserved:true,downloadedFiles:['browser-downloaded.docx','browser-downloaded.pdf']};
 fs.writeFileSync(dir+'browser-verification.json',JSON.stringify(result,null,2));await task.destroy();console.log(JSON.stringify(result));
})().catch(e=>{console.error(e);process.exitCode=1;});
