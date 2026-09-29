/**
 * Небольшие словари RU и EN для оценки «похожести» слова на язык.
 *
 * Из них строится модель буквенных биграмм (какие пары букв встречаются в языке),
 * а названия направлений дополнительно служат словарём точных совпадений и префиксов:
 * пользователь в автокомплите обычно набирает начало названия («nehw» → «турц»).
 *
 * Словари не обязаны быть полными — это статистика для детектора раскладки,
 * а не орфографический словарь.
 */

const RU_COMMON = `
и в не на я быть он с что а по это она этот к но они мы как из у который то за свой
весь год от так о для ты же все тот мочь вы человек такой его сказать только или ещё бы
себя один как уже до время если сам когда другой вот говорить наш мой знать стать при чтобы
дело жизнь кто первый очень два день её новый рука даже во со раз где там под можно ну
какой после их работа без самый потом надо хотеть ли слово идти большой должен место иметь
ничего сейчас тоже теперь каждый друг нет здесь лицо дом глаз там случай город вопрос
отпуск отдых путешествие тур туры поездка перелёт перелет билет билеты авиабилет самолёт
самолет рейс вылет прилёт аэропорт отель отели гостиница курорт пляж море океан остров
горы озеро река берег бассейн номер номера завтрак ужин обед питание всё включено трансфер
экскурсия экскурсии виза паспорт страховка багаж ручная кладь цена стоимость скидка акция
горящие путёвка путевка бронирование бронь оплата карта заказ заказы поддержка помощь
вопрос ответ документы ваучер чек возврат отмена перенос дата даты ночь ночи неделя месяц
взрослый взрослых ребёнок ребенок дети детей младенец семья семьёй вдвоём компания
звёзды звезды пять четыре три звезда рейтинг отзыв отзывы фото фотографии описание карта
центр район улица набережная первая линия песок галька вода тёплый теплый жаркий солнце
погода лето зима осень весна январь февраль март апрель май июнь июль август сентябрь
октябрь ноябрь декабрь сегодня завтра вчера утро вечер хорошо плохо спасибо пожалуйста
привет здравствуйте добрый можно нужно хочу найти искать поиск показать выбрать купить
москва петербург санкт казань сочи адлер краснодар ростов новосибирск екатеринбург самара
уфа пермь челябинск волгоград воронеж калининград нижний новгород тюмень иркутск владивосток
хабаровск омск красноярск минеральные воды махачкала мурманск архангельск кострома ярославль
турция египет эмираты таиланд тайланд вьетнам мальдивы индонезия бали китай куба доминикана
тунис греция кипр абхазия россия анталья кемер белек сиде аланья стамбул хургада шарм шейх
дубай абу даби шарджа пхукет паттайя самуи нячанг фукуок гоа индия танзания занзибар
сейшелы маврикий черногория испания италия франция чехия грузия армения азербайджан
узбекистан казахстан беларусь сербия болгария тбилиси батуми ереван баку алматы ташкент
мексика канкун бразилия япония корея сингапур малайзия филиппины камбоджа мадагаскар
кения марокко иордания израиль оман катар бахрейн шри ланка непал монголия
мир еда кафе ресторан бар меню официант счёт деньги рубль доллар евро телевизор интернет
кондиционер балкон вид кровать двухместный одноместный люкс стандарт спа массаж фитнес зал
аквапарк анимация клуб вечеринка дискотека шоу концерт магазины сувениры рынок базар прогулка
яхта катер лодка дайвинг снорклинг сёрфинг серфинг рыбалка сафари пустыня джунгли водопад
храм мечеть собор замок крепость площадь мост башня старый город район квартира апартаменты
вилла бунгало домик хостел гостевой шале санаторий пансионат лагерь база отдыха туристический
оператор агентство менеджер звонок чат сообщение письмо почта телефон адрес имя фамилия
`;

const EN_COMMON = `
the be to of and a in that have i it for not on with he as you do at this but his by from
they we say her she or an will my one all would there their what so up out if about who get
which go me when make can like time no just him know take people into year your good some
could them see other than then now look only come its over think also back after use two how
our work first well way even new want because any these give day most us is was are were been
has had did said very more such long great little own old right big high different small large
next early young important few public bad same able
travel trip tour tours holiday holidays vacation flight flights ticket tickets airport airline
hotel hotels resort beach sea ocean island mountain lake river pool room rooms breakfast dinner
lunch meal meals all inclusive transfer excursion visa passport insurance baggage luggage price
cost discount deal deals booking book order orders payment card support help question answer
documents voucher refund cancel change date dates night nights week month adult adults child
children kids infant family couple group star stars rating review reviews photo photos
description map center centre city town district street coast shore sand water warm hot sun
weather summer winter autumn spring january february march april may june july august
september october november december today tomorrow yesterday morning evening hello hi thanks
thank please welcome world search find show choose buy best cheap luxury spa garden view
turkey egypt emirates thailand vietnam maldives indonesia bali china cuba dominican republic
tunisia greece cyprus abkhazia russia antalya kemer belek side alanya istanbul hurghada sharm
sheikh dubai abu dhabi sharjah phuket pattaya samui nha trang phu quoc goa india tanzania
zanzibar seychelles mauritius montenegro spain italy france czech georgia armenia azerbaijan
uzbekistan kazakhstan belarus serbia bulgaria tbilisi batumi yerevan baku almaty tashkent mexico
cancun brazil japan korea singapore malaysia philippines cambodia madagascar kenya morocco
jordan israel oman qatar bahrain sri lanka nepal mongolia moscow petersburg saint kazan sochi
adler krasnodar rostov novosibirsk yekaterinburg samara ufa perm chelyabinsk volgograd voronezh
kaliningrad nizhny novgorod tyumen irkutsk vladivostok khabarovsk omsk krasnoyarsk mineralnye
vody makhachkala murmansk arkhangelsk
palace grand royal park plaza beach club villa suite suites apartments apart house inn lodge
boutique marina bay golden blue green white sunny paradise crystal ocean view sea front
food cafe restaurant menu waiter bill money dollar euro ruble television internet wifi air
conditioning balcony bed double single standard deluxe massage fitness gym waterpark
animation nightclub disco show concert shopping souvenirs walk yacht boat diving snorkeling
surfing fishing safari desert jungle waterfall temple mosque cathedral castle fortress square
bridge tower street flat apartment bungalow cottage hostel guest chalet camp agency manager call
chat message letter mail address name surname
`;

/**
 * Названия направлений и городов вылета (RU и EN) — словарь для точных
 * совпадений и префиксов. Префикс от 3 букв считается сильным сигналом.
 */
const DESTINATIONS_RU = `
турция египет оаэ эмираты таиланд тайланд вьетнам мальдивы шри-ланка индонезия бали китай
хайнань куба доминикана тунис греция крит родос кипр абхазия россия анталья кемер белек сиде
аланья стамбул бодрум мармарис фетхие хургада шарм-эль-шейх марса-алам дубай абу-даби шарджа
рас-эль-хайма фуджейра пхукет паттайя самуи краби нячанг фукуок фантьет гоа индия танзания
занзибар сейшелы маврикий черногория испания италия франция чехия грузия армения азербайджан
узбекистан казахстан беларусь сербия болгария тбилиси батуми ереван баку алматы ташкент мексика
канкун бразилия япония корея сингапур малайзия филиппины камбоджа мадагаскар кения марокко
иордания акаба израиль оман катар бахрейн непал монголия москва санкт-петербург петербург
казань сочи адлер краснодар анапа геленджик ростов новосибирск екатеринбург самара уфа пермь
челябинск волгоград воронеж калининград нижний новгород тюмень иркутск владивосток хабаровск
омск красноярск минеральные воды махачкала мурманск архангельск алтай байкал карелия дагестан
`;

const DESTINATIONS_EN = `
turkey egypt uae emirates thailand vietnam maldives sri-lanka indonesia bali china hainan cuba
dominican tunisia greece crete rhodes cyprus abkhazia russia antalya kemer belek side alanya
istanbul bodrum marmaris fethiye hurghada sharm-el-sheikh marsa-alam dubai abu-dhabi sharjah
ras-al-khaimah fujairah phuket pattaya samui krabi nha-trang phu-quoc phan-thiet goa india
tanzania zanzibar seychelles mauritius montenegro spain italy france czech georgia armenia
azerbaijan uzbekistan kazakhstan belarus serbia bulgaria tbilisi batumi yerevan baku almaty
tashkent mexico cancun brazil japan korea singapore malaysia philippines cambodia madagascar
kenya morocco jordan aqaba israel oman qatar bahrain nepal mongolia moscow saint-petersburg
petersburg kazan sochi adler krasnodar anapa gelendzhik rostov novosibirsk yekaterinburg samara
ufa perm chelyabinsk volgograd voronezh kaliningrad tyumen irkutsk vladivostok khabarovsk omsk
krasnoyarsk makhachkala murmansk arkhangelsk altai baikal karelia dagestan
`;

export type Lang = 'ru' | 'en';

function words(text: string): string[] {
    return text
        .toLowerCase()
        .split(/\s+/)
        .map((w) => w.trim())
        .filter(Boolean);
}

/** ё и е считаются одной буквой: пользователи часто пишут «е». */
export function normalizeWord(word: string, lang: Lang): string {
    const lower = word.toLowerCase();
    return lang === 'ru' ? lower.replace(/ё/g, 'е') : lower;
}

interface LangModel {
    bigrams: Map<string, number>;
    words: Set<string>;
    /** Названия направлений, разбитые на части по дефису/пробелу, плюс целые названия. */
    destinations: string[];
}

let cache: Record<Lang, LangModel> | null = null;

function build(common: string, dest: string, lang: Lang): LangModel {
    const all = [...words(common), ...words(dest)].map((w) => normalizeWord(w, lang));
    const bigrams = new Map<string, number>();
    for (const word of all) {
        for (const part of word.split('-')) {
            if (!part) continue;
            const padded = `^${part}$`;
            for (let i = 0; i < padded.length - 1; i += 1) {
                const bg = padded.slice(i, i + 2);
                bigrams.set(bg, (bigrams.get(bg) || 0) + 1);
            }
        }
    }
    const destinations = new Set<string>();
    for (const d of words(dest).map((w) => normalizeWord(w, lang))) {
        destinations.add(d);
        for (const part of d.split('-')) if (part.length >= 3) destinations.add(part);
    }
    return {
        bigrams,
        words: new Set(all.flatMap((w) => [w, ...w.split('-')]).filter(Boolean)),
        destinations: [...destinations],
    };
}

export function getLangModel(lang: Lang): LangModel {
    if (!cache) {
        cache = {
            ru: build(RU_COMMON, DESTINATIONS_RU, 'ru'),
            en: build(EN_COMMON, DESTINATIONS_EN, 'en'),
        };
    }
    return cache[lang];
}
