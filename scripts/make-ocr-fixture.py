from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
p=Path('examples/upload-fixtures');p.mkdir(parents=True,exist_ok=True)
im=Image.new('RGB',(1600,1100),'white');d=ImageDraw.Draw(im)
font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',52)
for i,line in enumerate(['가상 OCR 시험자료','객실 수: 20개','정비 시간: 30분','SYNTHETIC TEST ONLY','실제 현장 근거가 아닙니다.']):d.text((100,110+i*145),line,font=font,fill='black')
im.save(p/'synthetic-scan.png');im.save(p/'synthetic-scan.pdf','PDF',resolution=144)
print('OCR synthetic fixture created')
