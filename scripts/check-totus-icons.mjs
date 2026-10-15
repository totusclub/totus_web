#!/usr/bin/env node
/**
 * Проверка набора иконок Totus. Запуск: node --experimental-strip-types scripts/check-totus-icons.mjs
 * (Node 22+). В package.json не подключён — запускается руками после изменения набора.
 *
 * Проверяет:
 *  - сгенерированные файлы совпадают с scripts/icons/totus-icons.json;
 *  - ключи уникальны, у каждой иконки есть подпись и хотя бы один путь;
 *  - пути — допустимые SVG-команды, номера оранжевых путей в пределах;
 *  - все соответствия Level.Travel из ltIcons.ts ведут на существующие иконки.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const fail = (m) => errors.push(m);

// 1. генерация актуальна
try {
    execFileSync(process.execPath, [join(root, 'scripts/icons/gen-totus-icons.mjs'), '--check'], { stdio: 'pipe' });
} catch (e) {
    fail('сгенерированные файлы устарели — запустите node scripts/icons/gen-totus-icons.mjs\n' + String(e.stderr || ''));
}

// 2. сам набор
const data = JSON.parse(readFileSync(join(root, 'scripts/icons/totus-icons.json'), 'utf8'));
const keys = new Set();
const PATH_RE = /^[MmLlHhVvCcSsQqTtAaZz0-9eE.,\s+-]+$/;
let total = 0;
for (const s of data.sections) {
    for (const ic of s.icons) {
        total++;
        if (keys.has(ic.key)) fail('повтор ключа: ' + ic.key);
        keys.add(ic.key);
        if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(ic.key)) fail('ключ не в kebab-case: ' + ic.key);
        if (!ic.ru) fail('нет подписи: ' + ic.key);
        if (!ic.paths?.length) fail('нет путей: ' + ic.key);
        for (const d of ic.paths || []) {
            if (!PATH_RE.test(d) || !/^\s*[Mm]/.test(d)) fail(`недопустимый путь в ${ic.key}: ${d.slice(0, 40)}`);
        }
        for (const a of ic.accent || []) {
            if (!Number.isInteger(a) || a < 0 || a >= ic.paths.length) fail(`оранжевый путь ${a} вне диапазона: ${ic.key}`);
        }
    }
}

// 3. соответствия Level.Travel
let lt;
try {
    lt = await import(pathToFileURL(join(root, 'src/components/icons/totus/ltIcons.ts')).href);
} catch (e) {
    fail('не загрузился ltIcons.ts (нужен Node 22+ с --experimental-strip-types): ' + e.message);
}
let mapped = 0;
if (lt) {
    for (const [name, value] of Object.entries(lt)) {
        if (value && typeof value === 'object') {
            for (const [from, to] of Object.entries(value)) {
                mapped++;
                if (!keys.has(to)) fail(`${name}.${from} → нет иконки «${to}»`);
            }
        }
    }
    const fallbacks = [
        lt.mealIcon('XX'), lt.hotelTypeIcon(999), lt.wifiIcon('X'), lt.beachSurfaceIcon('X'),
        lt.beachTypeIcon('X'), lt.categoryIcon('X'), lt.confirmabilityIcon('9'), lt.restTypeIcon('X'),
        lt.roomFacilityIcon('new-group', 'Весы'), lt.roomFacilityIcon(null, 'Халаты'), lt.notificationIcon('x'),
        lt.amenityIcon('pool'),
    ];
    for (const k of fallbacks) if (!keys.has(k)) fail('запасная иконка не найдена: ' + k);
}

if (errors.length) {
    console.error('Ошибки набора иконок:\n- ' + errors.join('\n- '));
    process.exit(1);
}
console.log(`icons: ок — ${total} иконок, ${data.sections.length} разделов, ${mapped} соответствий Level.Travel`);
