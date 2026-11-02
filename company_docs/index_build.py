import json, html, os, re
import importlib.util
HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('b', os.path.join(HERE, 'build.py'))
b = importlib.util.module_from_spec(spec); spec.loader.exec_module(b)

OUT = os.path.join(HERE, 'build')
meta = json.load(open(os.path.join(OUT, 'meta.json'), encoding='utf-8'))
docs = meta['docs']

WHERE = {
 'terms': 'футер; экран регистрации; карточки в App Store, Google Play, RuStore',
 'privacy': 'футер каждой страницы; «Аккаунт» → «Документы»; URL Privacy Policy в сторах',
 'consent': 'пустой чекбокс у каждой формы: регистрация, заказ, обращение, «Изменить заказ»',
 'ads-consent': 'отдельный чекбокс при регистрации; настройки уведомлений',
 'cookies': 'баннер при первом визите; ссылка «Настройки cookie» в футере',
 'recommendations': 'футер; подборки «Вам подойдёт»; окно Маши',
 'requisites': 'страница «Правовая информация»; «Контакты»; «О приложении»',
 'tour-offer': 'чекбокс на шаге оплаты тура; письмо с заказом; Заявка на бронирование',
 'hotel-booking': 'чекбокс на шаге оплаты номера без перелёта; карточка номера',
 'cancellation': 'заказ → «Изменить заказ» / «Отменить»; карточка тура и номера',
 'tourist-memo': 'письмо с документами по туру; заказ в Аккаунте',
 'payment': 'шаг оплаты; письмо с чеком; страница «Правовая информация»',
}

def a(url, text):
    return f'<a href="{url}" target="_blank" rel="noopener">{html.escape(text)}</a>'

PUB = {s: '<span class="pill ok">На сайте</span>' if s in b.PACK1_SLUGS else '<span class="pill plan">На проверке</span>' for s in b.SITE}

rows1 = ''
rows2 = ''
for d in docs:
    oz = b.OZON.get(d['slug'])
    ozc = a(oz[1], oz[0]) if oz else '<span class="muted">нет — раздел их политики обработки персональных данных</span>'
    row = f'''<tr>
<td class="d"><a href="{d['file']}">{html.escape(d['title'])}</a><span class="path mono">totus.club/{b.SITE[d['slug']]}</span></td>
<td>{WHERE[d['slug']]}</td>
<td>{ozc}</td>
<td class="n">{PUB[d['slug']]}<span class="cnt">{d['ph']} {b.plural(d['ph'])}</span></td>
</tr>'''
    if d['slug'] in b.PACK1_SLUGS: rows1 += row
    else: rows2 += row

PACK3 = [
 ('Архив редакций', 'Все прошлые версии документов с датами — доказательство условий каждого заказа', ('Архив условий', 'https://docs.ozon.ru/legal/terms-of-use/ozon-travel/archive/')),
 ('Правила публикации отзывов', 'Когда появятся отзывы об отелях', ('Правила публикации отзывов для средств размещения', 'https://docs.ozon.ru/legal/terms-of-use/ozon-travel/publishing-rules-for-hotels/')),
 ('Правила акций и промокодов', 'При первой акции; отдельная страница на каждую', ('Акции Ozon Travel', 'https://docs.ozon.ru/legal/promo/ozon-travel/')),
 ('Внутренние документы по 152-ФЗ', 'Не публикуются: приказ об ответственном, положение о персональных данных, модель угроз, журналы, акт оценки вреда', None),
]

rows3 = ''.join(f'''<tr><td class="d"><span class="t">{html.escape(t)}</span></td><td>{w}</td><td>{a(o[1], o[0]) if o else '<span class="muted">—</span>'}</td><td class="n"><span class="pill none">Пачка 3</span></td></tr>''' for t, w, o in PACK3)

ASKS = [
 ('Реквизиты', ['Номер в реестре турагентов (РТА)', 'Регистрационный номер в реестре операторов персональных данных Роскомнадзора', 'Наименование на английском, почтовый адрес', 'Даты редакций документов']),
 ('Контакты', ['E-mail поддержки, для претензий и для запросов по персональным данным', 'Телефон поддержки и режим работы', 'Ответственный за обработку персональных данных — фамилия, имя, отчество и должность']),
 ('Подрядчики', ['Юрлицо Level.Travel', 'Хостинг-провайдер сервера и город', 'Оператор фискальных данных', 'SMS-провайдер, если есть', 'Провайдер языковой модели для Маши и страна']),
 ('Решения', ['Записываем ли звонки в поддержку', 'Кто правообладатель программ: ТОТУСКЛАБ или прежнее юрлицо по лицензии', 'Схема продажи номеров Level.Travel без перелёта', 'Вебвизор и рекламные пиксели — включать ли', 'Тихие часы и лимит рекламных пушей']),
 ('Регистрации', ['Уведомление Роскомнадзора о трансграничной передаче: push (США), страны поездок, ИИ-модель — если иностранная']),
]
asks = ''.join(f'<div class="ask"><h3>{h}</h3><ul>{"".join(f"<li>{html.escape(x)}</li>" for x in items)}</ul></div>' for h, items in ASKS)

total_ph = sum(d['ph'] for d in docs)
miss_rows = ''.join(f'<tr><td><mark class="ph">{html.escape(k)}</mark></td><td>{html.escape(", ".join(v))}</td></tr>' for k, v in sorted(meta['ph'].items(), key=lambda kv: (-len(kv[1]), kv[0].lower())))

page = f'''<title>Документы Totus Club</title>
{b.FONTS}
<style>
{b.TOKENS}
body{{font-family:"Onest",-apple-system,"Segoe UI",Roboto,sans-serif;font-size:15.5px;line-height:1.55}}
.wrap{{max-width:1080px;margin:0 auto;padding:44px 24px 88px}}
.eyebrow{{font-family:"IBM Plex Mono",monospace;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--accent)}}
h1{{font-size:38px;font-weight:700;line-height:1.1;letter-spacing:-.015em;margin:12px 0 0}}
.lead{{font-family:"PT Serif",Georgia,serif;font-size:18px;color:var(--ink-2);max-width:64ch;margin-top:14px}}
.stats{{display:flex;flex-wrap:wrap;gap:10px 28px;margin-top:22px;font-size:14px;color:var(--muted)}}
.stats b{{font-size:22px;color:var(--ink);font-weight:600;font-variant-numeric:tabular-nums;margin-right:6px}}
h2{{font-size:22px;font-weight:600;margin:52px 0 6px;display:flex;align-items:baseline;gap:12px;flex-wrap:wrap}}
h2 .sub{{font-size:14px;font-weight:400;color:var(--muted)}}
.note{{color:var(--ink-2);max-width:72ch;margin:4px 0 14px}}
.contours{{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px}}
.c{{background:var(--paper);border:1px solid var(--line);border-radius:10px;padding:14px 16px;display:flex;flex-direction:column;gap:6px}}
.c .k{{font-family:"IBM Plex Mono",monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}}
.c h3{{font-size:15.5px;font-weight:600;margin:0}}
.c p{{margin:0;font-size:14px;color:var(--ink-2)}}
.c .oz{{font-size:13px;color:var(--muted);border-top:1px dashed var(--line);padding-top:8px;margin-top:auto}}
.tbl{{overflow-x:auto;background:var(--paper);border:1px solid var(--line);border-radius:10px}}
table{{width:100%;border-collapse:collapse;font-size:14px;min-width:820px}}
th{{text-align:left;font-weight:500;font-size:12px;letter-spacing:.03em;color:var(--muted);padding:10px 14px;background:var(--code);border-bottom:1px solid var(--line)}}
td{{padding:13px 14px;border-bottom:1px solid var(--line);vertical-align:top;color:var(--ink-2)}}
tr:last-child td{{border-bottom:0}}
td.d{{width:32%}}
td.d a,td.d .t{{color:var(--ink);font-weight:600;font-size:15px;text-decoration:none;border-bottom:1px solid var(--line-strong)}}
td.d .t{{border-bottom:0}}
td.d a:hover{{color:var(--accent);border-color:var(--accent)}}
td.d .path{{display:block;margin-top:4px;font-size:12px;color:var(--muted)}}
td.n{{width:120px;white-space:nowrap}}
td a{{color:var(--accent-ink)}}
.pill{{display:inline-block;font-size:11.5px;font-weight:600;padding:2px 9px;border-radius:999px}}
.pill.ok{{background:var(--ok-bg);color:var(--ok)}}
.pill.plan{{background:var(--plan-bg);color:var(--plan)}}
.pill.none{{background:var(--none-bg);color:var(--none)}}
.cnt{{display:block;margin-top:5px;font-size:12.5px;color:var(--muted);font-variant-numeric:tabular-nums}}
.muted{{color:var(--muted)}}
.asks{{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px;margin-top:14px}}
.ask{{background:var(--paper);border:1px solid var(--line);border-radius:10px;padding:14px 18px}}
.ask h3{{font-size:14px;font-weight:600;margin:0 0 6px;display:flex;align-items:center;gap:8px}}
.ask h3::before{{content:"";width:10px;height:10px;border-radius:3px;background:var(--ph);border:1px solid var(--ph-ink);opacity:.8}}
.ask ul{{margin:0;padding-left:18px;font-size:14px;color:var(--ink-2)}}
.ask li{{margin:3px 0}}
.red{{color:var(--ph-ink)}}
.miss{{margin-top:14px}}
.miss td:first-child{{width:55%}}
.legend{{font-size:13.5px;color:var(--muted);margin-top:10px}}
.caveat{{margin-top:44px;padding:14px 18px;border:1px dashed var(--line-strong);border-radius:10px;font-size:14px;color:var(--ink-2)}}
.caveat b{{color:var(--ink)}}
@media (max-width:760px){{ h1{{font-size:30px}} .contours{{grid-template-columns:1fr}} .wrap{{padding:28px 16px 64px}} }}
</style>
<div class="wrap">
  <div class="eyebrow">ООО «ТОТУСКЛАБ» · по образцу Ozon Travel</div>
  <h1>Документы Totus Club</h1>
  <p class="lead">Полный набор юридических документов для сайта и приложений, собранный по структуре Ozon Travel и подогнанный под нашу схему: ТОТУСКЛАБ — владелец сервиса, турагент и оператор персональных данных. Пачка 1 опубликована на сайте, пачка 2 (туры и размещение) написана и ждёт проверки — каждый документ открывается отдельной страницей.</p>
  <div class="stats"><span><b>{len(b.PACK1_SLUGS)}</b>на сайте</span><span><b>{len(docs)-len(b.PACK1_SLUGS)}</b>в пачке 2 на проверке</span><span><b>{len(PACK3)}</b>в пачке 3</span><span><b>{total_ph}</b>полей заполнить</span></div>

  <h2>Три контура, как у Ozon Travel</h2>
  <p class="note">У Ozon Travel туры, отели и сама площадка закрыты разными документами — у нас так же.</p>
  <div class="contours">
    <div class="c"><span class="k">Контур В · платформа</span><h3>Сервис и аккаунт</h3><p>Соглашение, политика обработки персональных данных, согласия, cookie, рекомендации, реквизиты. Сторона — ТОТУСКЛАБ.</p><span class="oz">У Ozon: Ozon ID, политика обработки персональных данных «Интернет Трэвел», алгоритмы, согласие на рекламу</span></div>
    <div class="c"><span class="k">Контур А · туры</span><h3>Продажа турпродукта</h3><p>Оферта по форме № 766, памятка, отмена и возврат. Сторона — ТОТУСКЛАБ как турагент.</p><span class="oz">У Ozon: оферта о реализации туристского продукта</span></div>
    <div class="c"><span class="k">Контур Б · размещение</span><h3>Номера без перелёта</h3><p>Условия бронирования размещения; изменение, отмена и возврат.</p><span class="oz">У Ozon: лицензия на платформу, договор — напрямую с отелем</span></div>
  </div>

  <h2>Пачка 1 · Платформа <span class="sub">написано, открывайте</span></h2>
  <div class="tbl"><table>
    <thead><tr><th>Наш документ</th><th>Где показывать</th><th>Аналог у Ozon Travel</th><th>Статус</th></tr></thead>
    <tbody>{rows1}</tbody>
  </table></div>
  <p class="legend"><b class="red">Красным</b> в документах выделены поля, которых пока не хватает. Синие блоки — служебные заметки для вас и юриста, на сайт они не идут. Все 7 документов пачки 1 опубликованы на сайте (страница «Правовая информация»); в приложениях — после релиза totus_APP.</p>

  <h2>Пачка 2 · Туры и размещение <span class="sub">написано, на проверке — на сайт не загружено</span></h2>
  <div class="tbl"><table>
    <thead><tr><th>Наш документ</th><th>Где показывать</th><th>Аналог у Ozon Travel</th><th>Статус</th></tr></thead>
    <tbody>{rows2}</tbody>
  </table></div>

  <h2>Пачка 3 · Позже</h2>
  <div class="tbl"><table>
    <thead><tr><th>Документ</th><th>Когда нужен</th><th>Аналог у Ozon Travel</th><th>Статус</th></tr></thead>
    <tbody>{rows3}</tbody>
  </table></div>

  <h2>Чего не хватает <span class="sub">{len(meta['ph'])} разных данных · {total_ph} мест в текстах</span></h2>
  <p class="note">Опубликовано как есть: на сайте пустые места видны в квадратных скобках. Пришлите данные — подставлю во всех документах сразу.</p>
  <div class="asks">{asks}</div>
  <div class="tbl miss"><table>
    <thead><tr><th>Поле в тексте</th><th>В каких документах</th></tr></thead>
    <tbody>{miss_rows}</tbody>
  </table></div>

  <div class="caveat"><b>Черновики, а не финальные тексты.</b> Документы написаны по образцу Ozon Travel (прочитан 01.10.2026) с учётом 152-ФЗ в ред. 156-ФЗ, 38-ФЗ, ст. 10.2-2 149-ФЗ и 243-ФЗ об ИИ. Перед публикацией на сайте их должен проверить юрист. Ссылки вида totus.club/legal/… — будущие адреса на сайте; здесь между документами работают внутренние ссылки.</div>
</div>
'''
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(page)
print('index ok', len(page))
