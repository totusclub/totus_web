# Знак ₽ сайта: рисунок под метрики Museo Sans Cyrl (высота заглавных 706, штамб 72/99/129 при 300/500/700).
# Пишет scripts/ruble-glyph.json; base64 из него вставляется в @font-face «Totus Symbols» и «Golos Text»
# (unicode-range: U+20BD) в src/styles/globals.css. Запуск: pip install fonttools && python3 scripts/ruble-glyph.py
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.svgPathPen import SVGPathPen
import json, base64, io
K=0.5523
P={500:dict(sw=99,h=86,v=100,adv=650,sx=150),700:dict(sw=129,h=112,v=128,adv=670,sx=150),300:dict(sw=72,h=64,v=74,adv=630,sx=150)}
CAP=706
def draw(pen,wt,variant='std'):
    p=P[wt];sx,sw,h,v=p['sx'],p['sw'],p['h'],p['v']
    bb=300 if variant=='std' else 330           # низ чаши
    cy=(CAP+bb)/2; ryo=(CAP-bb)/2; rxo=205 if variant=='std' else 190
    bx=sx+sw+150-(0 if variant=='std' else 10)  # начало дуги
    lx=sx-120                                     # левый край перекладин
    def rect(x0,y0,x1,y1):
        pen.moveTo((x0,y0));pen.lineTo((x0,y1));pen.lineTo((x1,y1));pen.lineTo((x1,y0));pen.closePath()
    rect(sx,0,sx+sw,CAP)                 # штамб
    rect(sx,CAP-h,bx,CAP)                # верх чаши
    rect(lx,bb,bx,bb+h)                  # низ чаши, выходит влево
    y2=120 if variant=='std' else 110
    rect(lx,y2,lx+330 if variant=='std' else lx+300,y2+h)  # нижняя перекладина
    # дуга чаши: внешняя по часовой (сверху вниз справа), затем внутренняя обратно
    rxi,ryi=rxo-v,ryo-h
    pen.moveTo((bx,CAP))
    pen.curveTo((bx+rxo*K,CAP),(bx+rxo,cy+ryo*K),(bx+rxo,cy))
    pen.curveTo((bx+rxo,cy-ryo*K),(bx+rxo*K,bb),(bx,bb))
    pen.lineTo((bx,bb+h))
    pen.curveTo((bx+rxi*K,bb+h),(bx+rxi,cy-ryi*K),(bx+rxi,cy))
    pen.curveTo((bx+rxi,cy+ryi*K),(bx+rxi*K,CAP-h),(bx,CAP-h))
    pen.closePath()
out={}
for wt in (300,500,700):
    sp=SVGPathPen(None); draw(sp,wt); out[wt]=dict(d=sp.getCommands(),adv=P[wt]['adv'])
    fb=FontBuilder(1000,isTTF=True)
    fb.setupGlyphOrder(['.notdef','ruble'])
    fb.setupCharacterMap({0x20BD:'ruble'})
    g={}
    tp=TTGlyphPen(None); cp=Cu2QuPen(tp,1.0,reverse_direction=True); draw(cp,wt); g['ruble']=tp.glyph()
    e=TTGlyphPen(None); g['.notdef']=e.glyph()
    fb.setupGlyf(g)
    fb.setupHorizontalMetrics({'.notdef':(500,0),'ruble':(P[wt]['adv'],0)})
    fb.setupHorizontalHeader(ascent=950,descent=-250)
    fb.setupNameTable({'familyName':'Totus Ruble','styleName':str(wt)})
    fb.setupOS2(sTypoAscender=950,sTypoDescender=-250,usWinAscent=950,usWinDescent=250,usWeightClass=wt)
    fb.setupPost()
    b=io.BytesIO(); fb.font.flavor='woff'; fb.save(b)
    out[wt]['woff']=base64.b64encode(b.getvalue()).decode()
import os
path=os.path.join(os.path.dirname(os.path.abspath(__file__)),'ruble-glyph.json')
doc=json.load(open(path,encoding='utf-8'))
for wt in (300,500,700):
    doc['weights'][str(wt)].update(adv=out[wt]['adv'],d=out[wt]['d'],woff=out[wt]['woff'])
open(path,'w',encoding='utf-8').write(json.dumps(doc,ensure_ascii=False,indent=2)+'\n')
print('ruble-glyph.json обновлён; перенесите woff в globals.css')
