'use client';

import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';
import AuthModal from '@/components/auth/LazyAuthModal';
import { useSupportCall } from '@/components/support/SupportCallProvider';
import useAuth from '@/hooks/useAuth';
import { FAQ_GROUPS, HELP_HERO, HELP_POPULAR, type FaqGroup, type FaqItem } from '@/config/faqContent';
import { HelpIcon } from './helpIcons';
import styles from './infoPages.module.css';

// Центр помощи /help-faq — макет Figma «Частые вопросы · Центр помощи» (09.10.2026):
// поиск и «Часто ищут» → плитки разделов → оглавление + разделы с вопросами → «Не нашли ответ?».

const SUPPORT_CHAT = '/profile/support-chat';

export function questionsLabel(n: number): string {
    const m10 = n % 10;
    const m100 = n % 100;
    const word = m10 === 1 && m100 !== 11 ? 'вопрос' : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? 'вопроса' : 'вопросов';
    return `${n} ${word}`;
}

const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е');

/** Вопрос подходит, если каждое слово запроса есть в вопросе или ответе. */
export function matchItem(item: FaqItem, query: string): boolean {
    const words = norm(query).split(/\s+/).filter(Boolean);
    if (words.length === 0) return false;
    const text = norm([item.q, ...(item.steps ?? []), ...item.a].join(' '));
    return words.every((w) => text.includes(w));
}

const anchor = (g: FaqGroup) => `faq-${g.id}`;

function Answer({ item }: { item: FaqItem }) {
    return (
        <div className={styles.faqAnswer}>
            {item.steps ? (
                <ol>
                    {item.steps.map((s) => (
                        <li key={s}>{s}</li>
                    ))}
                </ol>
            ) : null}
            {item.a.map((p) => (
                <p key={p}>{p}</p>
            ))}
        </div>
    );
}

function Question({ item, open }: { item: FaqItem; open: boolean }) {
    return (
        <details className={styles.faqItem} open={open}>
            <summary>
                <span>{item.q}</span>
                <HelpIcon name="chevron" size={20} className={styles.chevron} />
            </summary>
            <Answer item={item} />
        </details>
    );
}

function Section({ group, index, items, searching }: { group: FaqGroup; index: number; items: FaqItem[]; searching: boolean }) {
    return (
        <section id={anchor(group)} className={styles.helpSection}>
            <h2 className={styles.numHeading}>
                <span className={styles.num} aria-hidden="true">
                    {index + 1}
                </span>
                {group.title}
            </h2>
            <div className={styles.faqList}>
                {items.map((item, i) => (
                    // В каждом разделе раскрыт первый вопрос; в результатах поиска — все найденные.
                    <Question key={item.q} item={item} open={searching || i === 0} />
                ))}
            </div>
        </section>
    );
}

/** Подсветка пункта оглавления для раздела, который сейчас на экране. */
function useActiveSection(ids: string[]): string {
    const [active, setActive] = useState(ids[0] ?? '');
    const key = ids.join(',');
    useEffect(() => {
        if (typeof IntersectionObserver === 'undefined') return;
        const els = key
            .split(',')
            .map((id) => document.getElementById(id))
            .filter((el): el is HTMLElement => !!el);
        const io = new IntersectionObserver(
            (entries) => {
                const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
                if (top) setActive(top.target.id);
            },
            { rootMargin: '-100px 0px -60% 0px' },
        );
        els.forEach((el) => io.observe(el));
        return () => io.disconnect();
    }, [key]);
    return active;
}

function HelpActions() {
    const router = useRouter();
    const { token } = useAuth();
    const { available: canCall, call } = useSupportCall();
    const [authOpen, setAuthOpen] = useState(false);
    const pending = useRef<null | (() => void)>(null);

    const openChat = () => router.push(SUPPORT_CHAT);
    const startCall = () => (canCall ? call() : openChat());
    const openMila = async () => {
        const { useAssistantStore } = await import('@tosmedia/ai-assistant');
        useAssistantStore.getState().setOpen(true);
    };

    // Гостю сначала окно входа, после входа — выбранное действие.
    const run = (action: () => void) => {
        if (token) return action();
        pending.current = action;
        setAuthOpen(true);
    };
    useEffect(() => {
        if (token && pending.current) {
            const action = pending.current;
            pending.current = null;
            // Даём виджету Милы и звонку подключиться после входа.
            setTimeout(action, 600);
        }
    }, [token]);

    const cards = [
        {
            icon: 'chat' as const,
            title: 'Чат с поддержкой',
            text: 'В Аккаунте на сайте, в приложении для телефона и планшета или на компьютере.',
            button: 'Написать в чат',
            primary: true,
            onClick: () => run(openChat),
        },
        {
            icon: 'phone' as const,
            title: 'Звонок в поддержку',
            text: 'Из приложения или прямо с сайта, одним нажатием и без телефонной линии.',
            button: 'Позвонить',
            primary: false,
            onClick: () => run(startCall),
        },
        {
            icon: 'sparkle' as const,
            title: 'Спросить Милу',
            text: 'ИИ-ассистент подберёт тур и ответит на вопросы о поездке.',
            button: 'Открыть Милу',
            primary: false,
            onClick: () => run(() => void openMila()),
        },
    ];

    return (
        <section className={styles.helpCard} aria-labelledby="help-contact">
            <h2 id="help-contact" className={styles.helpCardTitle}>
                Не нашли ответ?
            </h2>
            <p className={styles.helpMuted}>Выберите удобный способ — поддержка Totus Club поможет с заказом, оплатой и поездкой.</p>
            <div className={styles.contactGrid}>
                {cards.map((c) => (
                    <div key={c.title} className={styles.contactCard}>
                        <span className={styles.contactIcon}>
                            <HelpIcon name={c.icon} />
                        </span>
                        <div className={styles.contactBody}>
                            <h3 className={styles.contactTitle}>{c.title}</h3>
                            <p className={styles.contactText}>{c.text}</p>
                        </div>
                        <button
                            type="button"
                            className={c.primary ? styles.btnPrimary : styles.btnSecondary}
                            onClick={c.onClick}
                        >
                            {c.button}
                        </button>
                    </div>
                ))}
            </div>
            <AuthModal open={authOpen} setOpen={setAuthOpen} />
        </section>
    );
}

export function FaqContent() {
    const [query, setQuery] = useState('');
    const q = query.trim();
    const searching = q.length >= 2;

    const found = useMemo(
        () =>
            searching
                ? FAQ_GROUPS.map((group, index) => ({ group, index, items: group.items.filter((it) => matchItem(it, q)) })).filter(
                      (r) => r.items.length > 0,
                  )
                : [],
        [q, searching],
    );
    const foundCount = found.reduce((n, r) => n + r.items.length, 0);
    const active = useActiveSection(searching ? [] : FAQ_GROUPS.map(anchor));

    return (
        <div className={styles.help}>
            <section className={styles.helpHero}>
                <h1 className={styles.helpTitle}>{HELP_HERO.title}</h1>
                <p className={styles.helpMuted}>{HELP_HERO.text}</p>
                <form className={styles.searchRow} role="search" onSubmit={(e) => e.preventDefault()}>
                    <label className={styles.searchField}>
                        <HelpIcon name="search" size={20} className={styles.searchIcon} />
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Например: как вернуть деньги за тур"
                            aria-label="Поиск по вопросам"
                        />
                    </label>
                    <button type="submit" className={`${styles.btnPrimary} ${styles.searchBtn}`}>
                        Найти
                    </button>
                </form>
                <div className={styles.chips}>
                    <span className={styles.chipsLabel}>Часто ищут:</span>
                    {HELP_POPULAR.map((p) => (
                        <button
                            key={p.label}
                            type="button"
                            className={`${styles.chip} ${q === p.query ? styles.chipActive : ''}`}
                            onClick={() => setQuery(q === p.query ? '' : p.query)}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </section>

            {searching ? (
                <section className={styles.helpCard} aria-live="polite">
                    <div className={styles.resultsHead}>
                        <h2 className={styles.helpCardTitle}>
                            {foundCount ? `Найдено: ${questionsLabel(foundCount)}` : 'Ничего не нашли'}
                        </h2>
                        <button type="button" className={styles.linkBtn} onClick={() => setQuery('')}>
                            Сбросить поиск
                        </button>
                    </div>
                    {foundCount ? (
                        found.map((r) => <Section key={r.group.id} group={r.group} index={r.index} items={r.items} searching />)
                    ) : (
                        <p className={styles.helpMuted}>
                            Попробуйте другие слова или выберите раздел ниже. Можно сразу{' '}
                            <Link href={SUPPORT_CHAT} className={styles.link}>
                                написать в поддержку
                            </Link>
                            .
                        </p>
                    )}
                </section>
            ) : (
                <>
                    <h2 className={styles.tilesTitle}>Разделы помощи</h2>
                    <div className={styles.tiles}>
                        {FAQ_GROUPS.map((g) => (
                            <a key={g.id} href={`#${anchor(g)}`} className={styles.tile}>
                                <span className={styles.tileIcon}>
                                    <HelpIcon name={g.icon} />
                                </span>
                                <span className={styles.tileTitle}>{g.title}</span>
                                <span className={styles.tileCount}>{questionsLabel(g.items.length)}</span>
                            </a>
                        ))}
                    </div>

                    <div className={styles.helpLayout}>
                        <nav className={styles.toc} aria-label="Содержание">
                            <p className={styles.tocTitle}>Содержание</p>
                            {FAQ_GROUPS.map((g) => (
                                <a
                                    key={g.id}
                                    href={`#${anchor(g)}`}
                                    className={`${styles.tocItem} ${active === anchor(g) ? styles.tocActive : ''}`}
                                >
                                    <span>{g.title}</span>
                                    <span className={styles.tocCount}>{g.items.length}</span>
                                </a>
                            ))}
                        </nav>
                        <div className={styles.helpCard}>
                            {FAQ_GROUPS.map((g, i) => (
                                <Section key={g.id} group={g} index={i} items={g.items} searching={false} />
                            ))}
                        </div>
                    </div>
                </>
            )}

            <HelpActions />

            <p className={styles.helpLegal}>
                Условия работы сервиса и все документы — на странице{' '}
                <Link href="/legal" className={styles.link}>
                    «Правовая информация»
                </Link>
                .
            </p>
        </div>
    );
}
