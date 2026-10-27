'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'dist/site');fs.mkdirSync(out,{recursive:true});
// Publish only app files, never the working directory or source material corpus.
for(const name of ['index.html','style.css','app.js','catalog.js','catalog-v04.js','draft-engine.js','file-reader.js','ocr-reader.js','document-export.js'])fs.copyFileSync(path.join(root,'prototype',name),path.join(out,name));
fs.cpSync(path.join(root,'prototype/vendor'),path.join(out,'vendor'),{recursive:true});
fs.copyFileSync(path.join(root,'examples/material-draft-demo.json'),path.join(out,'demo.json'));
fs.writeFileSync(path.join(out,'.nojekyll'),'');
fs.copyFileSync(path.join(root,'LICENSE'),path.join(out,'LICENSE'));
fs.writeFileSync(path.join(out,'THIRD_PARTY_NOTICES.md'),fs.readFileSync(path.join(root,'THIRD_PARTY_NOTICES.md'),'utf8').replaceAll('(prototype/vendor/','(vendor/'));
const html=fs.readFileSync(path.join(out,'index.html'),'utf8');for(const [,url]of html.matchAll(/(?:src|href)="([^"#]+)"/g)){if(/^(https?:|mailto:)/.test(url))continue;assert(fs.existsSync(path.join(out,url)),'Missing web asset: '+url);}
assert(fs.existsSync(path.join(out,'vendor/ocr/kor.traineddata.gz')));assert(fs.existsSync(path.join(out,'vendor/export/font.js')));
console.log('웹 배포 파일과 상대 경로 검사 통과: dist/site');
