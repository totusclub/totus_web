'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
    AIRLINES_INTRO,
    BEFORE_FLIGHT_TIPS,
    FOREIGN_AIRLINES,
    RUSSIAN_AIRLINES,
    type AirlineRow,
} from '@/config/airlinesContent';
import styles from './infoPages.module.css';

/** Логотип по коду IATA; если картинка не загрузилась — показываем сам код. */
function AirlineLogo({ iata, name }: { iata: string; name: string }) {
    const [failed, setFailed] = useState(false);
    const ref = useRef<HTMLImageElement>(null);
    // Картинка могла не загрузиться ещё до гидрации — тогда onError уже не сработает.
    useEffect(() => {
        const img = ref.current;
        if (img && img.complete && img.naturalWidth === 0) setFailed(true);
    }, []);
    return (
        <div className={styles.airlineLogo}>
            {failed ? (
                <span className={styles.iata}>{iata}</span>
            ) : (
                <img
                    ref={ref}
                    src={`https://pics.avs.io/176/88/${iata}.png`}
                    alt={name}
                    width={88}
                    height={44}
                    loading="lazy"
                    decoding="async"
                    onError={() => setFailed(true)}
                />
            )}
        </div>
    );
}

function NumHeading({ n, children }: { n: number; children: ReactNode }) {
    return (
        <h2 className={styles.numHeading}>
            <span className={styles.num} aria-hidden="true">
                {n}
            </span>
            {children}
        </h2>
    );
}

function AirlineGrid({ n, title, rows }: { n: number; title: string; rows: AirlineRow[] }) {
    return (
        <section>
            <NumHeading n={n}>
                {title} · {rows.length}
            </NumHeading>
            <ul className={styles.airlines}>
                {rows.map(([iata, name, place]) => (
                    <li key={iata} className={styles.airline}>
                        <AirlineLogo iata={iata} name={name} />
                        <div>
                            <p className={styles.airlineName}>{name}</p>
                            <p className={styles.airlineMeta}>{place}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
}

export function AirlinesContent() {
    return (
        <div className={styles.body}>
            <p>{AIRLINES_INTRO}</p>

            <AirlineGrid n={1} title="Российские авиакомпании" rows={RUSSIAN_AIRLINES} />
            <AirlineGrid n={2} title="Зарубежные авиакомпании" rows={FOREIGN_AIRLINES} />

            <NumHeading n={3}>Перед вылетом</NumHeading>
            <div className={styles.tips}>
                {BEFORE_FLIGHT_TIPS.map((tip) => (
                    <p key={tip.title}>
                        <strong>{tip.title}.</strong> {tip.text}
                    </p>
                ))}
            </div>
        </div>
    );
}
