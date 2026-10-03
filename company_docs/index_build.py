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
 'recommendations': 'футер; подборки «Вам подойдёт»; окно Милы',
 'requisites': 'футер; «Контакты»; «О приложении»',
}

def a(url, text):
    return f'<a href="{url}" target="_blank" rel="noopener">{html.escape(text)}</a>'

rows1 = ''
for d in docs:
    oz = b.OZON.get(d['slug'])
    ozc = a(oz[1], oz[0]) if oz else '<span class="muted">нет — раздел их политики ПДн</span>'
    rows1 += f'''<tr>
<td class="d"><a href="{d['file']}">{html.escape(d['title'])}</a><span class="path mono">totus.club/legal/{d['slug']}</span></td>
<td>{WHERE[d['slug']]}</td>
<td>{ozc}</td>
<td class="n"><span class="pill ok">Черновик</span><span class="cnt">{d['ph']} {'поле' if d['ph']==1 else 'полей' if d['ph']>=5 else 'поля'}</span></td>
</tr>'''

PACK2 = [
 ('Оферта о заключении договора о реализации туристского продукта', 'tour-offer', 'ТОТУСКЛАБ — турагент. Строго по типовой форме приказа Минэкономразвития № 766, прил. 2 (турагент ↔ турист), с заявкой на бронирование и «Информацией о турагенте»', ('Оферта о заключении договора реализации туристского продукта', 'https://docs.ozon.ru/legal/terms-of-use/ozon-travel/travel-product/')),
 ('Условия бронирования размещения', 'hotel-booking', 'Номера без перелёта. Модель Ozon: бесплатная лицензия на платформу, договор проживания — напрямую со средством размещения. Нужно решение по схеме Level.Travel', ('Условия бронирования мест размещения', 'https://docs.ozon.ru/common/pravila-prodayoi-i-rekvizity/ozon-travel/conditions-booking-hotel/')),
 ('Оферта ООО «АРЛЕКИНОТУР» на бронирование размещения', 'arlekino-booking', 'Номера категории Arlekino: продавец — Арлекинотур, оплата сразу, подтверждение в админке, ваучер от Arlekino Tour', None),
 ('Изменение, отмена и возврат', 'cancellation', 'Для туров и для размещения отдельно; связь с кнопкой «Изменить заказ»; сроки возврата денег', ('Изменить или отменить тур', 'https://docs.ozon.ru/ozon-travel/tours/change-tour/')),
 ('Памятка туристу', 'tourist-memo', 'Документы в поездку, правила въезда, выезд детей, страхование, что делать в поездке, контакты экстренных служб', ('Подтверждение тура и документы', 'https://docs.ozon.ru/ozon-travel/tours/documents/')),
 ('Оплата и возврат денег', 'payment', 'СБП и карты через Банк ВТБ, кто получатель платежа, кассовый чек, сроки возврата на карту', ('Оплата и возврат денег', 'https://docs.ozon.ru/ozon-travel/pay-return/')),
]
PACK3 = [
 ('Архив редакций', 'Все прошлые версии документов с датами — доказательство условий каждого заказа', ('Архив условий', 'https://docs.ozon.ru/legal/terms-of-use/ozon-travel/archive/')),
 ('Правила публикации отзывов', 'Когда появятся отзывы об отелях', ('Правила публикации отзывов для средств размещения', 'https://docs.ozon.ru/legal/terms-of-use/ozon-travel/publishing-rules-for-hotels/')),
 ('Правила акций и промокодов', 'При первой акции; отдельная страница на каждую', ('Акции Ozon Travel', 'https://docs.ozon.ru/legal/promo/ozon-travel/')),
 ('Внутренние документы по 152-ФЗ', 'Не публикуются: приказ об ответственном, положение о ПДн, модель угроз, журналы, акт оценки вреда', None),
]

rows2 = ''.join(f'''<tr><td class="d"><span class="t">{html.escape(t)}</span><span class="path mono">totus.club/legal/{s}</span></td><td>{w}</td><td>{a(o[1], o[0]) if o else '<span class="muted">у Ozon нет — наш случай</span>'}</td><td class="n"><span class="pill plan">Пачка 2</span></td></tr>''' for t, s, w, o in PACK2)
rows3 = ''.join(f'''<tr><td class="d"><span class="t">{html.escape(t)}</span></td><td>{w}</td><td>{a(o[1], o[0]) if o else '<span class="muted">—</span>'}</td><td class="n"><span class="pill none">Пачка 3</span></td></tr>''' for t, w, o in PACK3)

ASKS = [
 ('Реквизиты', ['Номер в реестре турагентов (РТА)', 'Регистрационный номер в реестре операторов ПДн Роскомнадзора', 'Наименование на английском, почтовый адрес']),
 ('Контакты', ['E-mail поддержки, для претензий и для запросов по ПДн', 'Телефон поддержки и режим работы', 'Ответственный за обработку ПДн — ФИО и должность']),
 ('Подрядчики', ['Юрлицо Level.Travel', 'Хостинг-провайдер сервера и город', 'Оператор фискальных данных', 'SMS-провайдер, если есть', 'Провайдер языковой модели для Милы и страна']),
 ('Решения', ['Записываем ли звонки в поддержку', 'Кто правообладатель программ: ТОТУСКЛАБ или прежнее юрлицо по лицензии', 'Схема продажи номеров Level.Travel без перелёта', 'Вебвизор и рекламные пиксели — включать ли', 'Тихие часы и лимит рекламных пушей']),
 ('Регистрации', ['Уведомление РКН о трансграничной передаче: push (США), страны поездок, ИИ-модель — если иностранная']),
]
asks = ''.join(f'<div class="ask"><h3>{h}</h3><ul>{"".join(f"<li>{html.escape(x)}</li>" for x in items)}</ul></div>' for h, items in ASKS)

total_ph = sum(d['ph'] for d in docs)

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
.legend{{font-size:13.5px;color:var(--muted);margin-top:10px}}
.caveat{{margin-top:44px;padding:14px 18px;border:1px dashed var(--line-strong);border-radius:10px;font-size:14px;color:var(--ink-2)}}
.caveat b{{color:var(--ink)}}
@media (max-width:760px){{ h1{{font-size:30px}} .contours{{grid-template-columns:1fr}} .wrap{{padding:28px 16px 64px}} }}
</style>
<div class="wrap">
  <div class="eyebrow">ООО «ТОТУСКЛАБ» · по образцу Ozon Travel</div>
  <h1>Документы Totus Club</h1>
  <p class="lead">Полный набор юридических документов для сайта и приложений, собранный по структуре Ozon Travel и подогнанный под нашу схему: ТОТУСКЛАБ — владелец сервиса, турагент и оператор персональных данных, Арлекинотур — продавец номеров Arlekino. Первая пачка уже написана — каждый документ открывается отдельной страницей.</p>
  <div class="stats"><span><b>{len(docs)}</b>готовых черновиков</span><span><b>{len(PACK2)}</b>в пачке 2</span><span><b>{len(PACK3)}</b>в пачке 3</span><span><b>{total_ph}</b>полей заполнить</span></div>

  <h2>Три контура, как у Ozon Travel</h2>
  <p class="note">У Ozon Travel туры, отели и сама площадка закрыты разными документами — у нас так же.</p>
  <div class="contours">
    <div class="c"><span class="k">Контур В · платформа</span><h3>Сервис и аккаунт</h3><p>Соглашение, ПДн, согласия, cookie, рекомендации, реквизиты. Сторона — ТОТУСКЛАБ.</p><span class="oz">У Ozon: Ozon ID, политика ПДн «Интернет Трэвел», алгоритмы, согласие на рекламу</span></div>
    <div class="c"><span class="k">Контур А · туры</span><h3>Продажа турпродукта</h3><p>Оферта по форме № 766, памятка, отмена и возврат. Сторона — ТОТУСКЛАБ как турагент.</p><span class="oz">У Ozon: оферта о реализации туристского продукта</span></div>
    <div class="c"><span class="k">Контур Б · размещение</span><h3>Номера без перелёта</h3><p>Условия бронирования; для номеров Arlekino — оферта Арлекинотура.</p><span class="oz">У Ozon: лицензия на платформу, договор — напрямую с отелем</span></div>
  </div>

  <h2>Пачка 1 · Платформа <span class="sub">написано, открывайте</span></h2>
  <div class="tbl"><table>
    <thead><tr><th>Наш документ</th><th>Где показывать</th><th>Аналог у Ozon Travel</th><th>Статус</th></tr></thead>
    <tbody>{rows1}</tbody>
  </table></div>
  <p class="legend">Жёлтым в документах выделены поля, которые нужно заполнить. Синие блоки — служебные заметки для вас и юриста, на сайт они не идут.</p>

  <h2>Пачка 2 · Туры и размещение <span class="sub">следующая</span></h2>
  <div class="tbl"><table>
    <thead><tr><th>Наш документ</th><th>Что в нём</th><th>Аналог у Ozon Travel</th><th>Статус</th></tr></thead>
    <tbody>{rows2}</tbody>
  </table></div>

  <h2>Пачка 3 · Позже</h2>
  <div class="tbl"><table>
    <thead><tr><th>Документ</th><th>Когда нужен</th><th>Аналог у Ozon Travel</th><th>Статус</th></tr></thead>
    <tbody>{rows3}</tbody>
  </table></div>

  <h2>Что нужно от вас <span class="sub">чтобы убрать жёлтые поля</span></h2>
  <div class="asks">{asks}</div>

  <div class="caveat"><b>Черновики, а не финальные тексты.</b> Документы написаны по образцу Ozon Travel (прочитан 01.10.2026) с учётом 152-ФЗ в ред. 156-ФЗ, 38-ФЗ, ст. 10.2-2 149-ФЗ и 243-ФЗ об ИИ. Перед публикацией на сайте их должен проверить юрист. Ссылки вида totus.club/legal/… — будущие адреса на сайте; здесь между документами работают внутренние ссылки.</div>
</div>
'''
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(page)
print('index ok', len(page))
