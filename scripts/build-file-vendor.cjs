'use strict';
const fs=require('node:fs'),path=require('node:path'),esbuild=require('esbuild');
const dest=path.resolve('prototype/vendor');fs.mkdirSync(dest,{recursive:true});
for(const [input,output,globalName]of [['pdfjs-dist/build/pdf.mjs','pdf.js','pdfjsLib'],['pdfjs-dist/build/pdf.worker.mjs','pdf-worker.js','pdfjsWorker']]){
 esbuild.buildSync({entryPoints:[require.resolve(input)],outfile:path.join(dest,output),bundle:true,format:'iife',globalName,platform:'browser',target:'es2022',minify:true,legalComments:'eof',logLevel:'warning'});
}
for(const [src,name]of [['exceljs/dist/exceljs.min.js','exceljs.min.js'],['fflate/umd/index.js','fflate.min.js']]){
 const p=src.startsWith('fflate')?path.join(path.dirname(require.resolve('fflate/package.json')),'umd/index.js'):require.resolve(src);fs.copyFileSync(p,path.join(dest,name));
}
for(const [pkg,file]of [['pdfjs-dist','LICENSE'],['exceljs','LICENSE'],['fflate','LICENSE']])fs.copyFileSync(path.join(path.dirname(require.resolve(pkg+'/package.json')),file),path.join(dest,pkg+'-LICENSE.txt'));
console.log('파일 읽기 라이브러리와 라이선스 준비 완료');
const ocr=path.join(dest,'ocr');fs.mkdirSync(ocr,{recursive:true});
const tess=path.dirname(require.resolve('tesseract.js/package.json')),core=path.dirname(require.resolve('tesseract.js-core/package.json'));
for(const file of ['tesseract.min.js','worker.min.js','tesseract.min.js.LICENSE.txt','worker.min.js.LICENSE.txt'])fs.copyFileSync(path.join(tess,'dist',file),path.join(ocr,file));
for(const file of fs.readdirSync(core).filter(x=>x.endsWith('.wasm.js')||x==='LICENSE'))fs.copyFileSync(path.join(core,file),path.join(ocr,file));
fs.copyFileSync(path.join(tess,'LICENSE.md'),path.join(ocr,'tesseract-LICENSE.md'));
for(const lang of ['kor','eng']){const dir=path.dirname(require.resolve('@tesseract.js-data/'+lang+'/package.json'));fs.copyFileSync(path.join(dir,'4.0.0',lang+'.traineddata.gz'),path.join(ocr,lang+'.traineddata.gz'));fs.copyFileSync(path.join(dir,'package.json'),path.join(ocr,lang+'-package.json'));fs.copyFileSync(path.join(dir,'README.md'),path.join(ocr,lang+'-README.md'));}
console.log('한국어·영어 OCR 엔진과 언어 데이터 준비 완료');
