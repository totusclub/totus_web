// Фото страницы «О нас» хранятся в репозитории текстом (base64) в src/assets/about/*.webp.b64:
// через коннектор GitHub можно отправлять только текстовые файлы.
// Скрипт запускается перед сборкой (npm run build → prebuild) и перед dev (predev)
// и раскладывает картинки в public/about/, откуда их отдаёт Next.js.
// Если в public/about/ уже лежит такой же файл — ничего не делает.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'src/assets/about');
const OUT = join(root, 'public/about');

const sha = (buf) => createHash('sha256').update(buf).digest('hex');

export function decodeB64File(path) {
    const buf = Buffer.from(readFileSync(path, 'utf8').replace(/\s+/g, ''), 'base64');
    // WebP: «RIFF» + размер + «WEBP»
    if (buf.length < 12 || buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') {
        throw new Error(`${path}: не WebP после декодирования`);
    }
    if (buf.readUInt32LE(4) + 8 !== buf.length) {
        throw new Error(`${path}: размер не совпадает с заголовком RIFF (файл обрезан?)`);
    }
    return buf;
}

function main() {
    if (!existsSync(SRC)) return;
    mkdirSync(OUT, { recursive: true });
    for (const name of readdirSync(SRC).filter((f) => f.endsWith('.webp.b64'))) {
        const buf = decodeB64File(join(SRC, name));
        const target = join(OUT, name.replace(/\.b64$/, ''));
        if (existsSync(target) && sha(readFileSync(target)) === sha(buf)) continue;
        writeFileSync(target, buf);
        console.log(`[about-photos] ${target.slice(root.length + 1)} (${buf.length} B)`);
    }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
