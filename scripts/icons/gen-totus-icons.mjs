#!/usr/bin/env node
/**
 * Генерирует набор иконок Totus (стиль C) для сайта из scripts/icons/totus-icons.json.
 *
 *   node scripts/icons/gen-totus-icons.mjs          — записать файлы
 *   node scripts/icons/gen-totus-icons.mjs --check  — только сверить, что файлы актуальны
 *
 * Результат:
 *   src/components/icons/totus/icons.generated.ts     — по одной константе на иконку (tree-shaking)
 *   src/components/icons/totus/registry.generated.ts  — ключ → иконка, подписи, разделы
 *   src/components/icons/totus/hotelIcons.generated.ts — подмножество для поиска, отеля и номеров
 *
 * Источник правды — Figma u6A5og35jw0BBJyOkKl8Ij, страница «ICONS · Набор C».
 * JSON собран из неё (scripts/icons/build.py + manifest.py, основа — Tabler Icons, MIT).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const data = JSON.parse(readFileSync(join(root, 'scripts/icons/totus-icons.json'), 'utf8'));
const outDir = join(root, 'src/components/icons/totus');

const camel = (key) => 'icon' + key.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('');
const q = (s) => JSON.stringify(s);

const HEAD = `// АВТОГЕНЕРАЦИЯ: node scripts/icons/gen-totus-icons.mjs — руками не править.
// Набор иконок Totus, стиль C (утверждён 15.10.2026). Основа рисунка — Tabler Icons (MIT), см. LICENSE-tabler.txt.
`;

let icons = HEAD + `
/** Иконка: пути 24×24, номера оранжевых путей, признак заливки. */
export type TotusIconDef = {
    readonly p: readonly string[];
    readonly a: readonly number[];
    readonly f?: true;
};
`;
let registry = HEAD + `
import * as I from './icons.generated';
import type { TotusIconDef } from './icons.generated';
`;

const keys = [];
const sections = [];
for (const s of data.sections) {
    icons += `\n// ${s.title}\n`;
    sections.push([s.id, s.title, s.icons.map((i) => i.key)]);
    for (const ic of s.icons) {
        keys.push([ic.key, camel(ic.key), ic.ru]);
        const f = ic.fill ? ', f: true' : '';
        icons += `/** ${ic.ru} */\nexport const ${camel(ic.key)}: TotusIconDef = { p: [${ic.paths.map(q).join(', ')}], a: [${ic.accent.join(', ')}]${f} };\n`;
    }
}

registry += `
export const TOTUS_ICON_KEYS = [
${keys.map(([k]) => `    ${q(k)},`).join('\n')}
] as const;

export type TotusIconKey = (typeof TOTUS_ICON_KEYS)[number];

export const TOTUS_ICONS: Record<TotusIconKey, TotusIconDef> = {
${keys.map(([k, c]) => `    ${q(k)}: I.${c},`).join('\n')}
};

/** Русские подписи — для подсказок, alt и страниц-витрин. */
export const TOTUS_ICON_LABELS: Record<TotusIconKey, string> = {
${keys.map(([k, , ru]) => `    ${q(k)}: ${q(ru)},`).join('\n')}
};

/** Разделы набора — как в Figma и claude/ICONS_PLAN_RU.md. */
export const TOTUS_ICON_SECTIONS: ReadonlyArray<{ id: string; title: string; keys: readonly TotusIconKey[] }> = [
${sections.map(([id, t, ks]) => `    { id: ${q(id)}, title: ${q(t)}, keys: [${ks.map(q).join(', ')}] },`).join('\n')}
];
`;

// Подмножество для поиска, страницы отеля и номеров: иконки там выбираются по данным Level.Travel,
// поэтому нужен словарь ключ → иконка, но не весь набор (меньше JS на этих страницах).
const HOTEL_SECTIONS = ['filter', 'card', 'hotel', 'room', 'amenity'];
const HOTEL_EXTRA = ['transfer', 'mail', 'baggage', 'pin', 'calendar', 'nights', 'operator', 'best-price', 'discount'];
const hotelKeys = [...new Set([
    ...data.sections.filter((s) => HOTEL_SECTIONS.includes(s.id)).flatMap((s) => s.icons.map((i) => i.key)),
    ...HOTEL_EXTRA,
])];
const hotel = HEAD + `
import * as I from './icons.generated';
import type { TotusIconDef } from './icons.generated';
import type { TotusIconKey } from './registry.generated';

/** Иконки поиска, страницы отеля и номеров: разделы ${HOTEL_SECTIONS.join(', ')} и ${HOTEL_EXTRA.join(', ')}. */
export const HOTEL_ICONS: Partial<Record<TotusIconKey, TotusIconDef>> = {
${hotelKeys.map((k) => `    ${q(k)}: I.${camel(k)},`).join('\n')}
};
`;

const files = [
    [join(outDir, 'icons.generated.ts'), icons],
    [join(outDir, 'registry.generated.ts'), registry],
    [join(outDir, 'hotelIcons.generated.ts'), hotel],
];
if (process.argv.includes('--check')) {
    let ok = true;
    for (const [p, c] of files) {
        let cur = '';
        try { cur = readFileSync(p, 'utf8'); } catch { /* нет файла */ }
        if (cur !== c) { console.error('устарел: ' + p); ok = false; }
    }
    if (!ok) process.exit(1);
    console.log('icons: файлы актуальны (' + keys.length + ' иконок)');
} else {
    for (const [p, c] of files) writeFileSync(p, c);
    console.log('icons: записано ' + keys.length + ' иконок');
}
