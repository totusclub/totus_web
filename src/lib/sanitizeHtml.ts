/**
 * Санитайзер HTML для контента CMS (SECURITY_AUDIT_2026-11_RU.md, H6).
 *
 * Контент страниц редактируется в админке и раньше вставлялся в DOM как есть. Теперь из него
 * убираются скрипты, фреймы, обработчики событий и опасные URL — остаётся только разметка статьи
 * (абзацы, заголовки, списки, ссылки, картинки, таблицы) с ограниченным набором атрибутов.
 *
 * В браузере — разбор через DOM и allowlist тегов/атрибутов. На сервере (SSR) — регулярные
 * выражения: убирают теги <script>/<iframe>/<object>/<embed>/<style>/<link>/<meta>/<base>/<form>,
 * атрибуты on* и URL с javascript:/vbscript:/data:text. Клиентский рендер затем проходит DOM-путь.
 * Без внешних зависимостей (package.json не меняется).
 */

const ALLOWED_TAGS = new Set([
    'a', 'abbr', 'b', 'blockquote', 'br', 'caption', 'code', 'div', 'em', 'figcaption', 'figure',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img', 'li', 'mark', 'ol', 'p', 'pre', 's', 'small',
    'span', 'strong', 'sub', 'sup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'u', 'ul',
]);

const ALLOWED_ATTRS = new Set([
    'href', 'src', 'alt', 'title', 'class', 'style', 'width', 'height', 'target', 'rel',
    'colspan', 'rowspan', 'align', 'loading', 'id',
]);

const URL_ATTRS = new Set(['href', 'src']);

// Опасные теги: сначала целиком с содержимым (<script>…</script>), затем оставшиеся одиночные/незакрытые теги.
const DANGEROUS_BLOCK_RE = /<(script|iframe|object|embed|style|svg|math|template|noscript|form|select|textarea|button)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
const DANGEROUS_TAG_RE = /<\/?(script|iframe|object|embed|style|link|meta|base|form|input|button|textarea|select|svg|math|template|noscript)\b[^>]*>/gi;
const ON_ATTR_RE = /\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const BAD_URL_ATTR_RE = /\s+(href|src|xlink:href|action|formaction|srcdoc)\s*=\s*(?:"\s*(?:javascript|vbscript|data:(?!image\/))[^"]*"|'\s*(?:javascript|vbscript|data:(?!image\/))[^']*'|(?:javascript|vbscript|data:(?!image\/))[^\s>]+)/gi;
const BAD_STYLE_RE = /(expression\s*\(|behavior\s*:|-moz-binding|javascript\s*:|url\s*\(\s*['"]?\s*(?:javascript|vbscript|data:(?!image\/)))/i;

function isSafeUrl(value: string, attr: string): boolean {
    const v = value.trim().replace(/[\x00-\x1f\s]+/g, '').toLowerCase();
    if (!v) return true;
    if (v.startsWith('javascript:') || v.startsWith('vbscript:')) return false;
    if (v.startsWith('data:')) return attr === 'src' && v.startsWith('data:image/');
    return true;
}

function sanitizeStyle(value: string): string | null {
    if (BAD_STYLE_RE.test(value)) return null;
    return value;
}

/** Серверный (без DOM) вариант: грубая, но безопасная зачистка регулярными выражениями. */
export function sanitizeHtmlFallback(html: string): string {
    let out = String(html || '');
    for (let i = 0; i < 3; i += 1) {
        const next = out
            .replace(/<!--[\s\S]*?-->/g, '')
            .replace(DANGEROUS_BLOCK_RE, '')
            .replace(DANGEROUS_TAG_RE, '')
            .replace(ON_ATTR_RE, '')
            .replace(BAD_URL_ATTR_RE, '');
        if (next === out) break;
        out = next;
    }
    return out;
}

/** Браузерный вариант: DOM + allowlist тегов и атрибутов. */
export function sanitizeHtmlDom(html: string, doc: Document): string {
    const parsed = new (doc.defaultView?.DOMParser ?? DOMParser)().parseFromString(
        `<body>${String(html || '')}</body>`,
        'text/html',
    );
    const body = parsed.body;

    const walk = (node: Element) => {
        const children = Array.from(node.children);
        for (const child of children) {
            const tag = child.tagName.toLowerCase();
            if (!ALLOWED_TAGS.has(tag)) {
                // Контейнерные/неизвестные теги разворачиваем в текст и дочерние узлы; опасные — удаляем целиком.
                if (['script', 'iframe', 'object', 'embed', 'style', 'link', 'meta', 'base', 'form', 'svg', 'math', 'template', 'noscript', 'input', 'button', 'textarea', 'select'].includes(tag)) {
                    child.remove();
                } else {
                    walk(child);
                    while (child.firstChild) node.insertBefore(child.firstChild, child);
                    child.remove();
                }
                continue;
            }
            for (const attr of Array.from(child.attributes)) {
                const name = attr.name.toLowerCase();
                if (!ALLOWED_ATTRS.has(name) || name.startsWith('on')) {
                    child.removeAttribute(attr.name);
                    continue;
                }
                if (URL_ATTRS.has(name) && !isSafeUrl(attr.value, name)) {
                    child.removeAttribute(attr.name);
                    continue;
                }
                if (name === 'style') {
                    const safe = sanitizeStyle(attr.value);
                    if (safe === null) child.removeAttribute(attr.name);
                }
            }
            if (tag === 'a' && child.getAttribute('target') === '_blank') {
                child.setAttribute('rel', 'noopener noreferrer');
            }
            walk(child);
        }
    };
    walk(body);
    return body.innerHTML;
}

/** Точка входа: в браузере — DOM, на сервере — регулярные выражения. */
export function sanitizeCmsHtml(html: string): string {
    if (!html) return '';
    if (typeof document !== 'undefined' && typeof DOMParser !== 'undefined') {
        try {
            return sanitizeHtmlDom(html, document);
        } catch {
            return sanitizeHtmlFallback(html);
        }
    }
    return sanitizeHtmlFallback(html);
}
