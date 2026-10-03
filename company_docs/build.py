import re, glob, os, html, json
import markdown

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'src')
OUT = os.path.join(HERE, 'build')
os.makedirs(OUT, exist_ok=True)

OZON = {
 'terms': ('Условия использования Ozon ID', 'https://docs.ozon.ru/legal/terms-of-use/site/ozon-id-terms/'),
 'privacy': ('Политика ООО «Интернет Трэвел» в отношении обработки ПДн', 'https://docs.ozon.ru/legal/personal-data/ru/it/'),
 'consent': ('Общие условия согласия на обработку ПДн (Ozon Travel)', 'https://docs.ozon.ru/legal/partners/web/travel/'),
 'ads-consent': ('Согласие на получение рекламы', 'https://docs.ozon.ru/legal/terms-of-use/site/ads-agreement-ozon-tech/'),
 'cookies': None,
 'recommendations': ('Алгоритм рекомендаций на Ozon', 'https://docs.ozon.ru/legal/terms-of-use/site/algorithms/recomendation-algorithms/'),
 'requisites': ('Реквизиты ООО «Интернет Трэвел»', 'https://docs.ozon.ru/ozon-travel/contacts/law/'),
}

# planned docs (pack 2/3) for index + pending links
PLANNED = {
 'tour-offer': 'Оферта о заключении договора о реализации туристского продукта',
 'hotel-booking': 'Условия бронирования размещения',
 'cancellation': 'Изменение, отмена и возврат',
 'archive': 'Архив редакций',
}

def parse(path):
    raw = open(path, encoding='utf-8').read()
    m = re.match(r'---\n(.*?)\n---\n(.*)', raw, re.S)
    meta = {}
    for line in m.group(1).splitlines():
        k, v = line.split(':', 1)
        meta[k.strip()] = v.strip()
    meta['body'] = m.group(2)
    meta['file'] = meta['slug'] + '.html'
    return meta

docs = [parse(p) for p in sorted(glob.glob(SRC + '/*.md'))]
written = {d['slug']: d for d in docs}

def placeholders(text):
    return re.findall(r'\[\[(.+?)\]\]', text)

def render_body(md_text):
    # placeholders -> tokens before markdown
    md_text = re.sub(r'\[\[(.+?)\]\]', lambda m: '⟦' + m.group(1) + '⟧', md_text)
    h = markdown.markdown(md_text, extensions=['tables', 'nl2br', 'toc'])
    h = re.sub(r'⟦(.+?)⟧', lambda m: '<mark class="ph" title="Заполнить">' + m.group(1) + '</mark>', h)
    # internal links
    def fix(m):
        slug = m.group(1)
        inner = m.group(2)
        if slug in written:
            return f'<a href="{slug}.html">{inner}</a>'
        return f'<span class="pending" title="Документ будет в следующей пачке · totus.club/legal/{slug}">{inner}</span>'
    h = re.sub(r'<a href="https://totus\.club/legal/([a-z\-]+)">(.*?)</a>', fix, h)
    # external links new tab
    h = re.sub(r'<a href="(https?://[^"]+)">', r'<a href="\1" target="_blank" rel="noopener">', h)
    # blockquotes = service notes
    h = h.replace('<blockquote>', '<aside class="svc"><span class="svc-k">Служебная заметка · не публикуется</span>').replace('</blockquote>', '</aside>')
    # wrap tables
    h = h.replace('<table>', '<div class="tbl"><table>').replace('</table>', '</table></div>')
    return h

FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Onest:wght@500;600;700&family=PT+Serif:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap">'

TOKENS = '''
:root{
  --bg:#F4F6F5; --paper:#FFFFFF; --ink:#1A2329; --ink-2:#46535B; --muted:#76848B;
  --line:#DCE3E1; --line-strong:#BAC6C2;
  --accent:#0E6B70; --accent-soft:#DDEFEF; --accent-ink:#0A4F53;
  --ph:#FDE4E2; --ph-ink:#B42318;
  --svc:#EEF1F7; --svc-line:#9AA7C7; --svc-ink:#3A4566;
  --ok:#0E6B70; --ok-bg:#DDEFEF; --plan:#9A6412; --plan-bg:#F7EBD3; --none:#5B6570; --none-bg:#E9EDEF;
  --code:#EEF2F1;
}
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
    --bg:#101618; --paper:#161E20; --ink:#E6ECEA; --ink-2:#B5C0BD; --muted:#8696A0;
    --line:#29343A; --line-strong:#3C4A4F;
    --accent:#5FC1C4; --accent-soft:#173335; --accent-ink:#8FD8DA;
    --ph:#4A1D1A; --ph-ink:#FF9C94;
    --svc:#1C2336; --svc-line:#53608A; --svc-ink:#B7C2E6;
    --ok:#5FC1C4; --ok-bg:#173335; --plan:#E0A94A; --plan-bg:#3A2C12; --none:#A8B3BA; --none-bg:#242E32;
    --code:#1E282B;
  }
}
:root[data-theme="dark"]{
    --bg:#101618; --paper:#161E20; --ink:#E6ECEA; --ink-2:#B5C0BD; --muted:#8696A0;
    --line:#29343A; --line-strong:#3C4A4F;
    --accent:#5FC1C4; --accent-soft:#173335; --accent-ink:#8FD8DA;
    --ph:#4A1D1A; --ph-ink:#FF9C94;
    --svc:#1C2336; --svc-line:#53608A; --svc-ink:#B7C2E6;
    --ok:#5FC1C4; --ok-bg:#173335; --plan:#E0A94A; --plan-bg:#3A2C12; --none:#A8B3BA; --none-bg:#242E32;
    --code:#1E282B;
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font-family:"PT Serif",Georgia,"Times New Roman",serif;font-size:17px;line-height:1.6}
h1,h2,h3,.ui{font-family:"Onest",-apple-system,"Segoe UI",Roboto,sans-serif}
h1,h2,h3{text-wrap:balance;margin:0}
a{color:var(--accent-ink);text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:2px}
a:hover{color:var(--accent)}
a:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:2px}
mark.ph{background:var(--ph);color:var(--ph-ink);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ph-ink) 35%,transparent);padding:0 4px;border-radius:3px;font-family:"Onest",sans-serif;font-size:.86em;font-weight:500;box-decoration-break:clone;-webkit-box-decoration-break:clone}
.mono{font-family:"IBM Plex Mono",ui-monospace,monospace}
'''

DOC_CSS = TOKENS + '''
.top{position:sticky;top:0;z-index:5;background:var(--bg);border-bottom:1px solid var(--line)}
.top .in{max-width:1120px;margin:0 auto;padding:10px 24px;display:flex;gap:16px;align-items:center;justify-content:space-between;font-family:"Onest",sans-serif;font-size:14px}
.top a{text-decoration:none;color:var(--ink-2)}
.top a:hover{color:var(--accent)}
.top .draft{font-size:12px;color:var(--ph-ink);background:var(--ph);padding:2px 10px;border-radius:999px;font-weight:600;white-space:nowrap}
.layout{max-width:1120px;margin:0 auto;padding:36px 24px 96px;display:grid;grid-template-columns:240px minmax(0,1fr);gap:48px;align-items:start}
nav.toc{position:sticky;top:64px;font-family:"Onest",sans-serif;font-size:13.5px;line-height:1.4;max-height:calc(100vh - 90px);overflow:auto}
nav.toc .k{font-family:"IBM Plex Mono",monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:10px;display:block}
nav.toc ol{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2px}
nav.toc a{display:block;padding:5px 10px;border-radius:6px;color:var(--ink-2);text-decoration:none}
nav.toc a:hover{background:var(--paper);color:var(--ink)}
article{background:var(--paper);border:1px solid var(--line);border-radius:12px;padding:48px 56px 56px;min-width:0}
.eyebrow{font-family:"IBM Plex Mono",monospace;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--accent)}
article h1{font-size:32px;line-height:1.15;font-weight:700;margin:10px 0 14px;letter-spacing:-.01em}
.meta{display:flex;flex-wrap:wrap;gap:6px 18px;font-family:"Onest",sans-serif;font-size:13.5px;color:var(--muted);padding-bottom:22px;border-bottom:1px solid var(--line);margin-bottom:28px}
.meta b{color:var(--ink-2);font-weight:500}
.doc{max-width:68ch}
.doc h2{font-size:20px;font-weight:600;margin:38px 0 12px;scroll-margin-top:72px}
.doc h3{font-size:16px;font-weight:600;margin:24px 0 8px}
.doc p{margin:0 0 12px}
.doc ul,.doc ol{margin:0 0 14px;padding-left:22px}
.doc li{margin:4px 0}
.doc strong{font-weight:700}
.tbl{overflow-x:auto;margin:6px 0 18px;border:1px solid var(--line);border-radius:8px;max-width:none}
.doc .tbl{width:min(100%, 900px)}
table{border-collapse:collapse;width:100%;font-family:"Onest",sans-serif;font-size:14px;line-height:1.45}
th,td{padding:9px 12px;border-bottom:1px solid var(--line);vertical-align:top;text-align:left}
th{background:var(--code);font-weight:500;color:var(--muted);font-size:12.5px}
tr:last-child td{border-bottom:0}
td:first-child{color:var(--ink)}
aside.svc{margin:14px 0 18px;padding:12px 16px 12px 16px;background:var(--svc);border-left:3px solid var(--svc-line);border-radius:0 8px 8px 0;font-family:"Onest",sans-serif;font-size:14.5px;line-height:1.5;color:var(--svc-ink)}
aside.svc p{margin:0}
aside.svc .svc-k{display:block;font-family:"IBM Plex Mono",monospace;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;opacity:.8;margin-bottom:6px}
aside.svc a{color:inherit}
.pending{border-bottom:1px dashed var(--line-strong);color:var(--ink-2);cursor:help}
.foot{margin-top:40px;padding-top:18px;border-top:1px solid var(--line);font-family:"Onest",sans-serif;font-size:13.5px;color:var(--muted);display:flex;flex-wrap:wrap;gap:8px 20px}
.foot a{color:var(--ink-2)}
@media (max-width:900px){
  .layout{grid-template-columns:1fr;gap:20px;padding:20px 16px 72px}
  nav.toc{position:static;max-height:none;background:var(--paper);border:1px solid var(--line);border-radius:10px;padding:14px}
  article{padding:28px 20px 36px}
  article h1{font-size:26px}
  .top .in{padding:10px 16px}
}
@media print{ .top,nav.toc,aside.svc{display:none} article{border:0;padding:0} .layout{display:block} }
'''

def plural(n):
    if n % 10 == 1 and n % 100 != 11: return 'поле'
    if 2 <= n % 10 <= 4 and not 12 <= n % 100 <= 14: return 'поля'
    return 'полей'

# where the document lives on the site (totus.club/<slug>)
SITE = {'terms':'terms','privacy':'privacy-policy','consent':'consent','ads-consent':'ads-consent',
        'cookies':'cookie-settings','recommendations':'recommendations','requisites':'requisites'}

def doc_page(d, idx, total):
    body = render_body(d['body'])
    heads = re.findall(r'<h2 id="([^"]+)">(.*?)</h2>', body)
    toc = ''.join(f'<li><a href="#{i}">{t}</a></li>' for i, t in heads)
    ph = placeholders(d['body'])
    oz = OZON.get(d['slug'])
    oz_html = f'<span>Аналог у Ozon Travel: <a href="{oz[1]}" target="_blank" rel="noopener">{oz[0]}</a></span>' if oz else '<span>У Ozon Travel отдельного документа нет</span>'
    prev_next = []
    if idx > 0: prev_next.append(f'<a href="{docs[idx-1]["file"]}">← {docs[idx-1]["short"]}</a>')
    if idx < total-1: prev_next.append(f'<a href="{docs[idx+1]["file"]}">{docs[idx+1]["short"]} →</a>')
    edition = re.sub(r'\[\[(.+?)\]\]', r'<mark class="ph">\1</mark>', d['edition'])
    return f'''<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(d['short'])} · Totus Club</title>{FONTS}<style>{DOC_CSS}</style></head>
<body>
<div class="top"><div class="in"><a href="index.html">← Все документы Totus Club</a><span class="draft">Черновик · {len(ph)} {plural(len(ph))} заполнить</span></div></div>
<div class="layout">
<nav class="toc" aria-label="Содержание"><span class="k">Содержание</span><ol>{toc}</ol></nav>
<article>
<div class="eyebrow">ООО «ТОТУСКЛАБ» · документ {idx+1} из {total} пачки 1</div>
<h1>{html.escape(d['title'])}</h1>
<div class="meta"><span><b>{edition}</b></span><span>На сайте: <a class="mono" href="https://totus.club/{SITE[d['slug']]}" target="_blank" rel="noopener">totus.club/{SITE[d['slug']]}</a></span>{oz_html}</div>
<div class="doc">{body}</div>
<div class="foot">{' '.join(prev_next)}</div>
</article></div>
</body></html>'''

total = len(docs)
for i, d in enumerate(docs):
    open(os.path.join(OUT, d['file']), 'w', encoding='utf-8').write(doc_page(d, i, total))

# placeholders summary for index
summary = {}
for d in docs:
    for p in placeholders(d['body']) + placeholders(d['edition']):
        key = p.strip()
        summary.setdefault(key, [])
        if d['short'] not in summary[key]:
            summary[key].append(d['short'])
json.dump({'docs': [{k: v for k, v in d.items() if k != 'body'} | {'ph': len(placeholders(d['body']))} for d in docs], 'ph': summary},
          open(os.path.join(OUT, 'meta.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(total, 'docs;', sum(len(placeholders(d['body'])) for d in docs), 'placeholders;', len(summary), 'unique')
