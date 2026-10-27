'use strict';
const fs=require('node:fs'),path=require('node:path');
const dest=path.resolve('prototype/vendor/export');fs.mkdirSync(dest,{recursive:true});
fs.copyFileSync(require.resolve('pdfmake/build/pdfmake.min.js'),path.join(dest,'pdfmake.min.js'));
fs.copyFileSync(path.join(path.dirname(require.resolve('pdfmake/package.json')),'LICENSE'),path.join(dest,'pdfmake-LICENSE.txt'));
const font=fs.readFileSync(path.join(dest,'NanumGothic-Regular.ttf')).toString('base64');
fs.writeFileSync(path.join(dest,'font.js'),'/* NanumGothic: SIL OFL 1.1; see NanumGothic-OFL.txt. Unmodified font. */\nglobalThis.PlanningExportFont={"NanumGothic-Regular.ttf":'+JSON.stringify(font)+'};\n');
console.log('PDF 내보내기 도구·한글 글꼴 준비 완료');
