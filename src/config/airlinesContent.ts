/** Контент страницы /airlines. [код IATA, название, базовый город или страна]. */
export type AirlineRow = [iata: string, name: string, place: string];

export const AIRLINES_INTRO =
    'Перелёты в турах выполняют российские и зарубежные авиакомпании. Перевозчика выбирает туроператор; авиакомпания, номера рейсов, время вылета и нормы багажа видны при выборе перелёта до оплаты.';

export const RUSSIAN_AIRLINES: AirlineRow[] = [
    ['SU', 'Аэрофлот', 'Москва'],
    ['FV', 'Россия', 'Санкт-Петербург'],
    ['DP', 'Победа', 'Москва'],
    ['S7', 'S7 Airlines', 'Новосибирск, Москва'],
    ['U6', 'Уральские авиалинии', 'Екатеринбург'],
    ['N4', 'Nordwind Airlines', 'Москва'],
    ['ZF', 'Azur Air', 'Москва'],
    ['WZ', 'Red Wings', 'Москва'],
    ['UT', 'Utair', 'Тюмень, Москва'],
    ['5N', 'Smartavia', 'Архангельск, Санкт-Петербург'],
    ['EO', 'ИКАР', 'Москва'],
    ['Y7', 'NordStar', 'Красноярск'],
    ['YC', 'Ямал', 'Салехард'],
    ['R3', 'Якутия', 'Якутск'],
    ['A4', 'Азимут', 'Ростов-на-Дону'],
    ['HZ', 'Аврора', 'Владивосток'],
    ['IO', 'ИрАэро', 'Иркутск'],
];

export const FOREIGN_AIRLINES: AirlineRow[] = [
    ['TK', 'Turkish Airlines', 'Турция'],
    ['PC', 'Pegasus Airlines', 'Турция'],
    ['VF', 'AJet', 'Турция'],
    ['2S', 'Southwind Airlines', 'Турция'],
    ['EK', 'Emirates', 'ОАЭ'],
    ['FZ', 'flydubai', 'ОАЭ'],
    ['EY', 'Etihad Airways', 'ОАЭ'],
    ['G9', 'Air Arabia', 'ОАЭ'],
    ['QR', 'Qatar Airways', 'Катар'],
    ['MS', 'EgyptAir', 'Египет'],
    ['SM', 'Air Cairo', 'Египет'],
    ['VN', 'Vietnam Airlines', 'Вьетнам'],
    ['UL', 'SriLankan Airlines', 'Шри-Ланка'],
    ['CA', 'Air China', 'Китай'],
    ['CZ', 'China Southern Airlines', 'Китай'],
    ['MU', 'China Eastern', 'Китай'],
    ['HU', 'Hainan Airlines', 'Китай'],
    ['3U', 'Sichuan Airlines', 'Китай'],
    ['ET', 'Ethiopian Airlines', 'Эфиопия'],
    ['HY', 'Uzbekistan Airways', 'Узбекистан'],
    ['C6', 'Centrum Air', 'Узбекистан'],
    ['B2', 'Belavia', 'Беларусь'],
    ['J2', 'Azerbaijan Airlines', 'Азербайджан'],
    ['JU', 'Air Serbia', 'Сербия'],
    ['DV', 'SCAT Airlines', 'Казахстан'],
    ['SZ', 'Somon Air', 'Таджикистан'],
    ['W5', 'Mahan Air', 'Иран'],
];

export const BEFORE_FLIGHT_TIPS: { title: string; text: string }[] = [
    {
        title: 'Багаж',
        text: 'Нормы ручной клади и багажа зависят от авиакомпании и тарифа. Они указаны при выборе перелёта и в билете в Аккаунте.',
    },
    {
        title: 'Регистрация',
        text: 'На чартерные рейсы обычно регистрируют только в аэропорту. Приезжайте заранее: стойки закрываются за 40–60 минут до вылета.',
    },
    {
        title: 'Изменение рейса',
        text: 'Время вылета может измениться по решению перевозчика. Мы сообщим об этом по почте и в уведомлении, а актуальные данные будут в Аккаунте.',
    },
];
