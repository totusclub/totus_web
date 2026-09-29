/**
 * Детектор «не той раскладки»: решает, похоже ли слово на текст, набранный
 * в неправильной раскладке, и насколько мы в этом уверены.
 *
 * Для каждого слова сравниваются две гипотезы:
 *   A) слово набрано правильно (оцениваем его в своём языке);
 *   B) слово набрано в другой раскладке (конвертируем и оцениваем в другом языке).
 * Оценка — доля «нормальных» пар букв (биграмм) по модели из layoutLexicon
 * плюс штрафы за невозможные для языка символы и сочетания и бонус за
 * совпадение со словарём (в том числе по префиксу — важно для автокомплита).
 * Конвертация предлагается, только если гипотеза B заметно сильнее A.
 */

import {
    convertLayout,
    detectScript,
    directionFor,
    isCyrillicLetter,
    isLatinLetter,
    type LayoutDirection,
} from './keyboardLayout';
import { getLangModel, normalizeWord, type Lang } from './layoutLexicon';

/**
 * none   — оставить как есть;
 * low    — конвертированный вариант правдоподобен, но уверенности нет:
 *          пробовать его только если оригинал ничего не нашёл;
 * medium — скорее всего не та раскладка: пробовать, если оригинал ничего не нашёл;
 * high   — почти наверняка не та раскладка: вариант можно искать сразу и
 *          предпочесть его результаты.
 */
export type LayoutConfidence = 'none' | 'low' | 'medium' | 'high';

const CONFIDENCE_RANK: Record<LayoutConfidence, number> = { none: 0, low: 1, medium: 2, high: 3 };

export function maxConfidence(a: LayoutConfidence, b: LayoutConfidence): LayoutConfidence {
    return CONFIDENCE_RANK[a] >= CONFIDENCE_RANK[b] ? a : b;
}

export function confidenceAtLeast(value: LayoutConfidence, min: LayoutConfidence): boolean {
    return CONFIDENCE_RANK[value] >= CONFIDENCE_RANK[min];
}

export interface TokenLayoutAnalysis {
    token: string;
    /** Вариант в другой раскладке (null — слово нельзя/незачем конвертировать). */
    converted: string | null;
    direction: LayoutDirection | null;
    confidence: LayoutConfidence;
    originalScore: number;
    convertedScore: number;
}

/** Меньше трёх букв — слишком мало информации, чтобы судить о раскладке. */
const MIN_LETTERS = 3;
/** До скольки букв слово считается коротким (нужна поддержка словаря). */
const SHORT_WORD = 4;

const RU_VOWELS = /[аеёиоуыэюя]/;
const EN_VOWELS = /[aeiouy]/;

function isLetterOf(ch: string, lang: Lang): boolean {
    return lang === 'ru' ? isCyrillicLetter(ch) : isLatinLetter(ch);
}

function countLetters(text: string): number {
    let n = 0;
    for (const ch of text) if (isCyrillicLetter(ch) || isLatinLetter(ch)) n += 1;
    return n;
}

/** Убирает пунктуацию по краям слова («привет,» → «привет»). */
function trimPunctuation(word: string): string {
    return word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
}

/**
 * Насколько слово похоже на слово языка lang: от 0 до 1, либо -1,
 * если в слове есть символы, которых в словах этого языка не бывает
 * (например, «[» внутри английского слова после конвертации RU→EN).
 */
export function wordScore(rawWord: string, lang: Lang): number {
    const word = normalizeWord(trimPunctuation(rawWord), lang);
    if (!word) return 0;
    const model = getLangModel(lang);
    const parts = word.split('-').filter(Boolean);
    let total = 0;
    let count = 0;
    let penalty = 0;
    for (const part of parts) {
        for (const ch of part) {
            if (isLetterOf(ch, lang)) continue;
            if (/\p{N}/u.test(ch)) continue;
            if (lang === 'en' && ch === "'") continue; // don't, it's
            return -1;
        }
        const letters = [...part].filter((ch) => isLetterOf(ch, lang)).join('');
        if (!letters) continue;
        const padded = `^${letters}$`;
        for (let i = 0; i < padded.length - 1; i += 1) {
            const n = model.bigrams.get(padded.slice(i, i + 2)) || 0;
            total += n >= 4 ? 1 : n === 3 ? 0.85 : n === 2 ? 0.7 : n === 1 ? 0.45 : 0;
            count += 1;
        }
        const vowels = lang === 'ru' ? RU_VOWELS : EN_VOWELS;
        if (letters.length >= 4 && !vowels.test(letters)) penalty += 0.3;
        if (/(.)\1\1/.test(letters)) penalty += 0.3;
        if (lang === 'ru' && /^[ьъы]/.test(letters)) penalty += 0.4;
        if (lang === 'ru' && /[ьъ]{2}|[аеёиоуыэюя][ьъ]/.test(letters)) penalty += 0.3;
    }
    if (!count) return 0;
    return Math.max(0, total / count - penalty);
}

/** Слово есть в словаре или является началом известного направления (от 3 букв). */
export function isKnownWord(rawWord: string, lang: Lang): boolean {
    const word = normalizeWord(trimPunctuation(rawWord), lang);
    if (word.length < 2) return false;
    const model = getLangModel(lang);
    if (model.words.has(word)) return true;
    if (word.length < 3) return false;
    return model.destinations.some((d) => d.startsWith(word));
}

const NONE = (token: string, originalScore = 0): TokenLayoutAnalysis => ({
    token,
    converted: null,
    direction: null,
    confidence: 'none',
    originalScore,
    convertedScore: 0,
});

/** Анализ одного слова (без пробелов). */
export function analyzeToken(token: string): TokenLayoutAnalysis {
    const script = detectScript(token);
    const direction = directionFor(script);
    if (!direction) return NONE(token);

    const srcLang: Lang = script === 'ru' ? 'ru' : 'en';
    const dstLang: Lang = srcLang === 'ru' ? 'en' : 'ru';
    const converted = convertLayout(token, direction);
    if (converted === token) return NONE(token);

    const originalScore = wordScore(token, srcLang);
    const convertedScore = wordScore(converted, dstLang);
    const base = { token, converted, direction, originalScore, convertedScore };

    // Конвертация дала невозможные для языка символы — это не опечатка раскладки.
    if (convertedScore < 0) return { ...NONE(token, originalScore) };

    const letters = countLetters(converted);
    const originalKnown = isKnownWord(token, srcLang);
    const convertedKnown = isKnownWord(converted, dstLang);

    if (letters < MIN_LETTERS) {
        // Короткие слова: только как запасной вариант, если он есть в словаре.
        return convertedKnown && !originalKnown ? { ...base, confidence: 'low' } : { ...base, confidence: 'none' };
    }

    // Нормальное слово своего языка («привет», «hello») не трогаем.
    if (originalKnown) return { ...base, confidence: 'none' };

    const diff = convertedScore - originalScore;
    let confidence: LayoutConfidence = 'none';

    if (convertedKnown && convertedScore >= 0.4 && originalScore < 0.8) {
        // конвертированное слово — известное слово или начало названия направления
        confidence = 'high';
    } else if (diff >= 0.3 && convertedScore >= 0.6) {
        confidence = 'high';
    } else if (diff >= 0.2 && convertedScore >= 0.5) {
        confidence = 'medium';
    } else if (convertedScore >= 0.45 && diff >= -0.1 && originalScore < 0.9) {
        confidence = 'low';
    }

    // В коротких словах (3–4 буквы) статистика по парам букв ненадёжна
    // («суп» ↔ «ceg»): без словарного подтверждения — только запасной вариант.
    if (letters <= SHORT_WORD && !convertedKnown && confidenceAtLeast(confidence, 'medium')) {
        // исключение — явный случай: оригинал почти невозможен, вариант безупречен
        confidence = originalScore <= 0.3 && convertedScore >= 0.9 ? 'medium' : 'low';
    }

    return { ...base, confidence };
}

export interface QueryLayoutAnalysis {
    query: string;
    tokens: TokenLayoutAnalysis[];
    /**
     * Запрос, где исправлены только слова с уверенностью medium/high.
     * Корректные слова остаются как есть: «руддщ world» → «hello world».
     */
    variant: string | null;
    variantConfidence: LayoutConfidence;
    /**
     * Запасной вариант: все слова, которые можно конвертировать, переведены
     * в другую раскладку. Используется, только если оригинал ничего не нашёл.
     */
    fallback: string | null;
}

/** Анализ всего запроса по словам; пробелы и порядок слов сохраняются. */
export function analyzeQuery(query: string): QueryLayoutAnalysis {
    const parts = query.split(/(\s+)/);
    const tokens: TokenLayoutAnalysis[] = [];
    const variantParts: string[] = [];
    const fallbackParts: string[] = [];
    let variantConfidence: LayoutConfidence = 'none';
    let variantChanged = false;
    let fallbackChanged = false;

    for (const part of parts) {
        if (!part || /^\s+$/.test(part)) {
            variantParts.push(part);
            fallbackParts.push(part);
            continue;
        }
        const a = analyzeToken(part);
        tokens.push(a);
        if (a.converted && confidenceAtLeast(a.confidence, 'medium')) {
            variantParts.push(a.converted);
            variantChanged = true;
            variantConfidence = variantConfidence === 'none' ? a.confidence : minConfidence(variantConfidence, a.confidence);
        } else {
            variantParts.push(part);
        }
        if (a.converted && confidenceAtLeast(a.confidence, 'low')) {
            fallbackParts.push(a.converted);
            fallbackChanged = true;
        } else {
            fallbackParts.push(part);
        }
    }

    const variant = variantChanged ? variantParts.join('') : null;
    const fallbackQuery = fallbackChanged ? fallbackParts.join('') : null;

    return {
        query,
        tokens,
        variant,
        variantConfidence: variant ? variantConfidence : 'none',
        fallback: fallbackQuery && fallbackQuery !== variant ? fallbackQuery : null,
    };
}

function minConfidence(a: LayoutConfidence, b: LayoutConfidence): LayoutConfidence {
    return CONFIDENCE_RANK[a] <= CONFIDENCE_RANK[b] ? a : b;
}
