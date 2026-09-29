/**
 * Тесты поиска с учётом раскладки клавиатуры.
 * Запуск: npm run test:search
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { convertLayout, detectScript } from './keyboardLayout';
import { analyzeQuery, analyzeToken } from './searchNormalizer';
import { buildSearchCandidates, filterWithLayoutFallback, searchWithLayoutFallback } from './searchCandidates';

test('конвертация раскладки — посимвольно, не транслитерация', () => {
    assert.equal(convertLayout('руддщ', 'ruToEn'), 'hello');
    assert.equal(convertLayout('ghbdtn', 'enToRu'), 'привет');
    assert.equal(convertLayout('Ghbdtn', 'enToRu'), 'Привет');
    assert.equal(convertLayout('[jhjij', 'enToRu'), 'хорошо');
    assert.equal(convertLayout('le,fq', 'enToRu'), 'дубай');
    assert.equal(convertLayout('Ihb-Kfyrf', 'enToRu'), 'Шри-Ланка');
    // одиночная пунктуация вне слова не превращается в букву
    assert.equal(convertLayout('ghbdtn ,', 'enToRu'), 'привет ,');
    assert.equal(detectScript('hello'), 'en');
    assert.equal(detectScript('привет'), 'ru');
    assert.equal(detectScript('hello руддщ'), 'mixed');
    assert.equal(detectScript('2025'), 'none');
});

test('руддщ → hello (хотели EN, была RU)', () => {
    const c = buildSearchCandidates('руддщ');
    assert.deepEqual(c.map((x) => x.query), ['руддщ', 'hello']);
    assert.equal(c[1].confidence, 'high');
});

test('ghbdtn → привет (хотели RU, была EN)', () => {
    const c = buildSearchCandidates('ghbdtn');
    assert.deepEqual(c.map((x) => x.query), ['ghbdtn', 'привет']);
    assert.equal(c[1].confidence, 'high');
});

test('нормальные слова не конвертируются', () => {
    for (const q of ['привет', 'hello', 'hello world', 'турция', 'turkey', 'Анталья', 'дубай', 'Rixos', 'Хилтон']) {
        assert.deepEqual(buildSearchCandidates(q).map((x) => x.query), [q], q);
    }
    // Короткие слова: допускается только запасной вариант (low), который
    // запрашивается лишь при пустом результате оригинала.
    for (const q of ['кофе', 'суп', 'чай', 'дом', 'sea', 'spa']) {
        const alt = buildSearchCandidates(q).slice(1);
        assert.ok(alt.every((x) => x.confidence === 'low'), q);
    }
});

test('смешанный запрос: исправляется только слово в чужой раскладке', () => {
    assert.equal(analyzeQuery('руддщ world').variant, 'hello world');
    assert.equal(analyzeQuery('hello руддщ').variant, 'hello hello');
    assert.equal(analyzeQuery('ghbdtn мир').variant, 'привет мир');
});

test('направления в неправильной раскладке, в том числе начало слова', () => {
    assert.equal(analyzeToken('nehwbz').converted, 'турция');
    assert.equal(analyzeToken('nehwbz').confidence, 'high');
    assert.equal(analyzeToken('nehw').confidence, 'high'); // «турц» — начало «турция»
    assert.equal(analyzeToken('Tubgtn').converted, 'Египет');
    assert.equal(analyzeToken('le,fq').converted, 'дубай');
    assert.equal(analyzeToken('вгифш').converted, 'dubai');
});

test('короткий ввод (1–2 буквы) не порождает вариантов', () => {
    assert.equal(buildSearchCandidates('ne').length, 1);
    assert.equal(buildSearchCandidates('g').length, 1);
    assert.equal(buildSearchCandidates('').length, 1);
    assert.equal(buildSearchCandidates('  ').length, 1);
});

test('кандидатов не больше трёх', () => {
    for (const q of ['руддщ world ghbdtn', 'nehwbz tubgtn', 'vjcrdf cjxb']) {
        assert.ok(buildSearchCandidates(q).length <= 3, q);
    }
});

// Имитация API: знает только «hello» и «привет»
const fakeApi = (known: string[]) => {
    const calls: string[] = [];
    const search = async (q: string) => {
        calls.push(q);
        return known.includes(q.toLowerCase()) ? [q] : [];
    };
    return { calls, search };
};
const has = (r: string[]) => r.length > 0;

test('API: руддщ — результаты для hello', async () => {
    const api = fakeApi(['hello']);
    const r = await searchWithLayoutFallback('руддщ', api.search, has);
    assert.equal(r.candidate.query, 'hello');
    assert.deepEqual(r.result, ['hello']);
    assert.equal(api.calls[0], 'руддщ'); // оригинал запрашивается первым
    assert.equal(api.calls.length, 2);
});

test('API: ghbdtn — результаты для привет', async () => {
    const api = fakeApi(['привет']);
    const r = await searchWithLayoutFallback('ghbdtn', api.search, has);
    assert.equal(r.candidate.query, 'привет');
});

test('API: обычный запрос — ровно один запрос без изменений', async () => {
    for (const q of ['привет', 'hello', 'hello world']) {
        const api = fakeApi(['привет', 'hello', 'hello world']);
        const r = await searchWithLayoutFallback(q, api.search, has);
        assert.equal(r.candidate.source, 'original');
        assert.deepEqual(api.calls, [q]);
    }
});

test('API: medium/low-вариант запрашивается, только если оригинал пуст', async () => {
    // «cnjk» (стол) — короткое слово, уверенность ниже high
    const found = fakeApi(['cnjk', 'стол']);
    const r1 = await searchWithLayoutFallback('cnjk', found.search, has);
    assert.equal(r1.candidate.source, 'original');
    assert.deepEqual(found.calls, ['cnjk']);

    const empty = fakeApi(['стол']);
    const r2 = await searchWithLayoutFallback('cnjk', empty.search, has);
    assert.equal(r2.candidate.query, 'стол');
});

test('API: ошибка варианта не ломает поиск, ошибка оригинала пробрасывается', async () => {
    const r = await searchWithLayoutFallback(
        'руддщ',
        async (q) => {
            if (q === 'hello') throw new Error('network');
            return ['x'];
        },
        has,
    );
    assert.equal(r.candidate.source, 'original');
    await assert.rejects(searchWithLayoutFallback('hello', async () => { throw new Error('down'); }, has));
});

test('локальный фильтр: vjcrdf → Москва', () => {
    const cities = ['Москва', 'Санкт-Петербург', 'Казань'];
    const filter = (q: string) => cities.filter((c) => c.toLowerCase().includes(q.toLowerCase()));
    assert.deepEqual(filterWithLayoutFallback('vjcrdf', filter).results, ['Москва']);
    assert.deepEqual(filterWithLayoutFallback('Каз', filter).results, ['Казань']);
    assert.deepEqual(filterWithLayoutFallback('', filter).results, cities);
});
