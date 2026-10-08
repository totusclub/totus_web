import Link from 'next/link';
import { FAQ_GROUPS, FAQ_INTRO } from '@/config/faqContent';
import styles from './infoPages.module.css';

function Chevron() {
    return (
        <svg className={styles.chevron} viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function FaqContent() {
    return (
        <div className={styles.body}>
            <p>{FAQ_INTRO}</p>

            {FAQ_GROUPS.map((group, gi) => (
                <section key={group.title}>
                    <h2 className={styles.numHeading}>
                        <span className={styles.num} aria-hidden="true">
                            {gi + 1}
                        </span>
                        {group.title}
                    </h2>
                    <div className={styles.faqList}>
                        {group.items.map((item) => (
                            <details key={item.q} className={styles.faqItem} open>
                                <summary>
                                    <span>{item.q}</span>
                                    <Chevron />
                                </summary>
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
                            </details>
                        ))}
                    </div>
                </section>
            ))}

            <p className={styles.faqCta}>
                <strong>Не нашли ответ?</strong>{' '}
                <Link href="/profile/support-chat" className={styles.link}>
                    Написать в поддержку
                </Link>
            </p>
        </div>
    );
}
