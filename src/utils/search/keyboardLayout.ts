/**
 * Конвертация текста между раскладками клавиатуры RU (ЙЦУКЕН) и EN (QWERTY).
 *
 * Это НЕ транслитерация: каждый символ заменяется символом, который находится
 * на той же физической клавише в другой раскладке.
 *   руддщ  → hello   (хотели EN, была включена RU)
 *   ghbdtn → привет  (хотели RU, была включена EN)
 */

export type LayoutDirection = 'ruToEn' | 'enToRu';
export type TokenScript = 'ru' | 'en' | 'mixed' | 'none';

// Одна клавиша — один символ, строки одинаковой длины.
const EN_KEYS = "qwertyuiop[]asdfghjkl;'zxcvbnm,.`QWERTYUIOP{}ASDFGHJKL:\"ZXCVBNM<>~";
const RU_KEYS = 'йцукенгшщзхъфывапролджэячсмитьбюёЙЦУКЕНГШЩЗХЪФЫВАПРОЛДЖЭЯЧСМИТЬБЮЁ';

const EN_TO_RU = new Map<string, string>();
const RU_TO_EN = new Map<string, string>();
for (let i = 0; i < EN_KEYS.length; i += 1) {
    EN_TO_RU.set(EN_KEYS[i], RU_KEYS[i]);
    RU_TO_EN.set(RU_KEYS[i], EN_KEYS[i]);
}

const CYRILLIC_LETTER = /[а-яё]/i;
const LATIN_LETTER = /[a-z]/i;
/** Клавиши, которые в EN-раскладке дают пунктуацию, а в RU — буквы (х ъ ж э б ю ё). */
const EN_LAYOUT_PUNCT = /[[\]{};:'"<>,.`~]/;

export function isCyrillicLetter(ch: string): boolean {
    return CYRILLIC_LETTER.test(ch);
}

export function isLatinLetter(ch: string): boolean {
    return LATIN_LETTER.test(ch);
}

/** Какими буквами набран фрагмент: только кириллица, только латиница, смесь или букв нет. */
export function detectScript(text: string): TokenScript {
    let ru = false;
    let en = false;
    for (const ch of text) {
        if (isCyrillicLetter(ch)) ru = true;
        else if (isLatinLetter(ch)) en = true;
    }
    if (ru && en) return 'mixed';
    if (ru) return 'ru';
    if (en) return 'en';
    return 'none';
}

/**
 * Для EN→RU знаки [ ] ; ' , . ` и т.п. — это буквы х ъ ж э б ю ё, но только
 * внутри «слова». Одиночная пунктуация (например, запятая после слова в конце)
 * не трогается: конвертируем знак, только если рядом есть буква.
 */
function isLetterAt(text: string, index: number): boolean {
    const ch = text[index];
    return ch !== undefined && (isLatinLetter(ch) || isCyrillicLetter(ch));
}

/** Переводит текст в другую раскладку посимвольно. Цифры, пробелы и дефисы не меняются. */
export function convertLayout(text: string, direction: LayoutDirection): string {
    const map = direction === 'enToRu' ? EN_TO_RU : RU_TO_EN;
    let out = '';
    for (let i = 0; i < text.length; i += 1) {
        const ch = text[i];
        const mapped = map.get(ch);
        if (mapped === undefined) {
            out += ch;
            continue;
        }
        if (direction === 'enToRu' && EN_LAYOUT_PUNCT.test(ch)) {
            // знак препинания превращаем в букву только внутри слова
            out += isLetterAt(text, i - 1) || isLetterAt(text, i + 1) ? mapped : ch;
            continue;
        }
        out += mapped;
    }
    return out;
}

/** Направление конвертации для фрагмента, набранного в одной раскладке. */
export function directionFor(script: TokenScript): LayoutDirection | null {
    if (script === 'ru') return 'ruToEn';
    if (script === 'en') return 'enToRu';
    return null;
}
