(function(root){
'use strict';
// Only presentation changes here. Never rewrite, round or validate source text.
function model(markdown){
 const lines=String(markdown).replace(/\r\n/g,'\n').split('\n'),blocks=[];let serial=0;
 for(let i=0;i<lines.length;i++){
  const line=lines[i];if(!line){blocks.push({kind:'space'});continue;}
  const h=/^(#{1,3}) (.*)$/.exec(line);
  if(h){blocks.push({kind:'heading',level:h[1].length,text:h[2],id:'section'+(++serial)});continue;}
  // Consecutive labelled metadata become real tables; retain the whole text.
  if(/^- [^:\n]+:/.test(line)&&/^- [^:\n]+:/.test(lines[i+1]||'')){
   const rows=[];while(i<lines.length&&/^- [^:\n]+:/.test(lines[i])){const s=lines[i].slice(2),p=s.indexOf(':');rows.push([s.slice(0,p),s.slice(p+1)]);i++;}i--;
   blocks.push({kind:'table',rows});continue;
  }
  blocks.push({kind:'text',text:line});
 }
 const first=blocks.find(b=>b.kind==='heading'&&b.level===1);if(first)first.cover=true;
 return {title:first?.text||'기획서 초안',blocks};
}
const xml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function validate(m){for(const b of m.blocks){for(const s of b.kind==='table'?b.rows.flat():[b.text||''])if(/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(s))throw Error('문서에 저장할 수 없는 제어 문자가 있습니다. 입력 자료를 확인하세요.');}}
function docx(m,zipper){
 validate(m);const x=zipper||root.fflate,run=s=>'<w:r><w:t xml:space="preserve">'+xml(s)+'</w:t></w:r>';
 const p=(s,props='')=>'<w:p><w:pPr>'+props+'</w:pPr>'+run(s)+'</w:p>';
 const toc=m.blocks.filter(b=>b.kind==='heading'&&b.level===2).map(b=>'<w:p><w:hyperlink w:anchor="'+b.id+'">'+run(b.text)+'</w:hyperlink></w:p>').join('');
 let body=p(m.title,'<w:pStyle w:val="Title"/>')+p('목차','<w:pStyle w:val="Heading1"/>')+toc+p('','<w:pageBreakBefore/>');
 let bookmark=0;
 for(const b of m.blocks){
  if(b.kind==='space')continue;
  if(b.kind==='heading'){
   if(b.cover)continue;bookmark++;
   body+='<w:p><w:pPr><w:pStyle w:val="Heading'+(b.level-1)+'"/></w:pPr><w:bookmarkStart w:id="'+bookmark+'" w:name="'+b.id+'"/>'+run(b.text)+'<w:bookmarkEnd w:id="'+bookmark+'"/></w:p>';
  }else if(b.kind==='text')body+=p(b.text);
  else body+='<w:tbl><w:tblPr><w:tblW w:w="9638" w:type="dxa"/><w:tblBorders>'+['top','left','bottom','right','insideH','insideV'].map(k=>'<w:'+k+' w:val="single" w:sz="4" w:color="D4DFE4"/>').join('')+'</w:tblBorders></w:tblPr><w:tblGrid><w:gridCol w:w="2600"/><w:gridCol w:w="7038"/></w:tblGrid>'+b.rows.map(row=>'<w:tr>'+row.map((s,i)=>'<w:tc><w:tcPr><w:tcW w:w="'+(i?7038:2600)+'" w:type="dxa"/>'+(!i?'<w:shd w:val="clear" w:fill="EEF4F5"/>':'')+'</w:tcPr>'+p(s)+'</w:tc>').join('')+'</w:tr>').join('')+'</w:tbl>';
 }
 const head='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',ns='xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
 const files={
  '[Content_Types].xml':head+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>'+['document','styles','footer1'].map(f=>'<Override PartName="/word/'+f+'.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.'+({document:'document.main',styles:'styles',footer1:'footer'}[f])+'+xml"/>').join('')+'</Types>',
  '_rels/.rels':head+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
  'word/document.xml':head+'<w:document '+ns+'><w:body>'+body+'<w:sectPr><w:footerReference w:type="default" r:id="rFooter"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567"/></w:sectPr></w:body></w:document>',
  'word/_rels/document.xml.rels':head+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rFooter" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>',
  'word/styles.xml':head+'<w:styles '+ns+'><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="NanumGothic" w:hAnsi="NanumGothic" w:eastAsia="맑은 고딕"/><w:sz w:val="20"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="100" w:line="300" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>'+[['Title',36],['Heading1',28],['Heading2',23]].map(([id,size],i)=>'<w:style w:type="paragraph" w:styleId="'+id+'"><w:name w:val="'+id+'"/><w:pPr><w:keepNext/><w:spacing w:before="200" w:after="120"/>'+(i?'<w:outlineLvl w:val="'+(i-1)+'"/>':'')+'</w:pPr><w:rPr><w:b/><w:color w:val="173D48"/><w:sz w:val="'+size+'"/></w:rPr></w:style>').join('')+'</w:styles>',
  'word/footer1.xml':head+'<w:ftr '+ns+'><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:fldSimple w:instr="PAGE"/></w:p></w:ftr>'
 };
 return x.zipSync(Object.fromEntries(Object.entries(files).map(([k,v])=>[k,x.strToU8(v)])));
}
function pdfDefinition(m){
 validate(m);
 const content=[{text:m.title,fontSize:22,margin:[0,0,0,22]},{toc:{title:{text:'목차',fontSize:16,margin:[0,0,0,14]}},pageBreak:'after'}];
 for(const b of m.blocks){
  if(b.kind==='space'||b.kind==='heading'&&b.cover)continue;
  if(b.kind==='heading')content.push({text:b.text,id:b.id,tocItem:b.level===2,fontSize:b.level===2?15:11.5,color:'#173D48',margin:[0,14,0,7],headlineLevel:b.level});
  else if(b.kind==='text')content.push({text:b.text,margin:[0,0,0,5]});
  else content.push({table:{widths:[110,'*'],body:b.rows.map(row=>row.map((text,i)=>({text,fillColor:i?null:'#eef4f5',margin:[3,3,3,3]})))},layout:'lightHorizontalLines',margin:[0,4,0,10]});
 }
 return {info:{title:m.title,creator:'프로젝트 공장'},pageSize:'A4',pageMargins:[48,48,48,48],defaultStyle:{font:'NanumGothic',fontSize:10,lineHeight:1.3},content,footer:(page,pages)=>({text:page+' / '+pages,alignment:'center',fontSize:8,margin:[0,16,0,0]}),pageBreakBefore:(node,following)=>node.headlineLevel&&!following.length};
}
function pdf(m,engine){return new Promise((resolve,reject)=>{try{
 const maker=engine||root.pdfMake;if(!maker||!root.PlanningExportFont?.['NanumGothic-Regular.ttf'])throw Error('PDF 도구 또는 글꼴을 불러오지 못했습니다. 새로고침 후 다시 시도하세요.');
 const doc=maker.createPdf(pdfDefinition(m),null,{NanumGothic:{normal:'NanumGothic-Regular.ttf',bold:'NanumGothic-Regular.ttf',italics:'NanumGothic-Regular.ttf',bolditalics:'NanumGothic-Regular.ttf'}},root.PlanningExportFont).getStream(),chunks=[];
 doc.on('data',chunk=>chunks.push(chunk));doc.on('error',reject);doc.on('end',()=>{const bytes=new Uint8Array(chunks.reduce((n,c)=>n+c.length,0));let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}resolve(bytes);});doc.end();
 }catch(e){reject(e);}});}

const api={model,docx,pdfDefinition,pdf};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PlanningExport=api;
})(typeof globalThis!=='undefined'?globalThis:this);
