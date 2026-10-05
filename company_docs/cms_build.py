"""Сборка HTML для CMS сайта (админка → «Страницы») и приложений.

Результат — cms/<slug>.html: только тело документа, без служебных заметок
для юриста. Незаполненные поля [[…]] остаются видимыми в квадратных скобках.
Ссылки totus.club/legal/<doc> ведут на страницы сайта или становятся текстом,
если документа ещё нет.
"""
import os, re, json, importlib.util
import markdown

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('b', os.path.join(HERE, 'build.py'))
b = importlib.util.module_from_spec(spec); spec.loader.exec_module(b)

OUT = os.path.join(HERE, 'cms')
os.makedirs(OUT, exist_ok=True)


def to_cms(d):
    md = d['body']
    # служебные заметки (блоки "> ...") не публикуются
    md = '\n'.join(l for l in md.split('\n') if not l.lstrip().startswith('>'))
    md = re.sub(r'\[\[(.+?)\]\]', lambda m: '⟦' + m.group(1) + '⟧', md)
    h = markdown.markdown(md, extensions=['tables', 'nl2br'])
    h = re.sub(r'⟦(.+?)⟧', lambda m: '<span class="legal-ph">[' + m.group(1) + ']</span>', h)

    def link(m):
        slug, inner = m.group(1), m.group(2)
        if slug in b.SITE:
            return f'<a href="/{b.SITE[slug]}">{inner}</a>'
        return inner
    h = re.sub(r'<a href="https://totus\.club/legal/([a-z\-]+)">(.*?)</a>', link, h)
    edition = re.sub(r'\[\[(.+?)\]\]', r'[\1]', d['edition'])
    if not edition.lower().startswith(('редакция', 'актуально')):
        edition = 'Редакция от ' + edition
    return f'<p><em>{edition}</em></p>\n{h}\n'


index = []
for d in b.docs:
    slug = b.SITE[d['slug']]
    html_body = to_cms(d)
    open(os.path.join(OUT, slug + '.html'), 'w', encoding='utf-8').write(html_body)
    index.append({'slug': slug, 'source': d['slug'], 'name': d['title'], 'short': d['short']})
json.dump(index, open(os.path.join(OUT, 'pages.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('cms:', ', '.join(i['slug'] for i in index))
