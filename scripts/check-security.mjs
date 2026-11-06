// Проверки SECURITY_AUDIT_2026-11 (H6/H8) по исходникам: node scripts/check-security.mjs
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
let passed = 0;
const check = (name, fn) => { try { fn(); passed += 1; console.log(`ok   - ${name}`); } catch (e) { console.error(`FAIL - ${name}: ${e.message}`); process.exitCode = 1; } };

check('CmsStaticPage: HTML из CMS проходит sanitizeCmsHtml перед dangerouslySetInnerHTML', () => {
  const src = read('src/components/staticInfoPage/CmsStaticPage.tsx');
  assert.match(src, /import \{ sanitizeCmsHtml \} from '@\/lib\/sanitizeHtml';/);
  assert.match(src, /return sanitizeCmsHtml\(stripWhiteBackgrounds\(raw\)\);/);
  assert.match(src, /dangerouslySetInnerHTML=\{\{ __html: content \}\}/);
});

check('Сайт не ходит в /api/admin/pages* (SECURITY_ENFORCE_MATRIX)', () => {
  for (const f of ['src/components/staticInfoPage/CmsStaticPage.tsx', 'src/lib/cmsPage.ts', 'src/hooks/useCmsPage.ts']) {
    assert.ok(!read(f).includes('/api/admin/pages'), `${f} содержит /api/admin/pages`);
  }
});

check('next.config: заголовки безопасности на /:path*, CSP по умолчанию Report-Only', () => {
  const cfg = read('next.config.ts');
  for (const h of ['X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy', 'Permissions-Policy', 'Strict-Transport-Security']) {
    assert.ok(cfg.includes(`key: '${h}'`), `нет ${h}`);
  }
  assert.match(cfg, /source: '\/:path\*',\s*headers: securityHeaders\(\)/);
  assert.match(cfg, /process\.env\.CSP_MODE \|\| 'report-only'/);
  assert.ok(cfg.includes("Content-Security-Policy-Report-Only"));
  assert.ok(cfg.includes("frame-ancestors 'self'") && cfg.includes("object-src 'none'"));
});

// Санитайзер (серверный путь) — через транспиляцию TS без зависимостей (typescript есть в node_modules Next).
try {
  const ts = await import('typescript').then((m) => m.default ?? m);
  const js = ts.transpileModule(read('src/lib/sanitizeHtml.ts'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
  const mod = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
  const cases = [
    ['<p>ok</p><script>alert(1)</script>', (s) => !/<\/?script/i.test(s) && s.includes('<p>ok</p>')],
    ['<img src=x onerror="alert(1)">', (s) => !/onerror/i.test(s)],
    ['<a href="javascript:alert(1)">x</a>', (s) => !/javascript/i.test(s)],
    ['<a href="https://totus.club">x</a>', (s) => s.includes('href="https://totus.club"')],
    ['<iframe src="https://evil"></iframe><p>t</p>', (s) => !/iframe/i.test(s) && s.includes('<p>t</p>')],
    ['<svg onload=alert(1)><circle/></svg><b>b</b>', (s) => !/svg|onload/i.test(s) && s.includes('<b>b</b>')],
    ['<a href="data:text/html;base64,PHNjcmlwdD4=">x</a>', (s) => !/data:text/.test(s)],
    ['<img src="data:image/png;base64,AAAA">', (s) => /data:image/.test(s)],
  ];
  check('sanitizeHtmlFallback (SSR): script/iframe/svg/on*/javascript:/data:text убираются, разметка и https-ссылки остаются', () => {
    for (const [inp, ok] of cases) { const out = mod.sanitizeHtmlFallback(inp); assert.ok(ok(out), `${inp} -> ${out}`); }
  });
} catch (e) {
  console.log(`skip - sanitizeHtmlFallback: typescript недоступен (${e.message})`);
}

console.log(`\n${passed} проверок прошло${process.exitCode ? ', есть ошибки' : ''}`);
