'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { getHomePartners, type HomePartner } from '@/api/homePartnersApi';
import styles from './infoPages.module.css';

const PHOTOS = [
    { src: '/about/couple.webp', alt: 'Отдых для двоих: пара на пляже' },
    { src: '/about/friends.webp', alt: 'Поездки с друзьями: друзья на террасе у моря' },
];

const STEPS = [
    {
        title: 'Туры и отели',
        text: 'Поиск по направлениям, датам и бюджету, фильтры по питанию, звёздам, линии пляжа и туроператору.',
    },
    {
        title: 'Мила — ИИ-ассистент',
        text: 'Опишите поездку своими словами, и Мила подберёт туры и ответит на вопросы. Ваши личные данные ИИ не получает.',
    },
    {
        title: 'Живая поддержка',
        text: 'Чат с сотрудником поддержки в Аккаунте и звонок прямо из приложения, без телефонной линии.',
    },
];

const REQUISITES = [
    'Общество с ограниченной ответственностью «ТОТУСКЛАБ»',
    'ИНН / КПП: 9729424935 / 772901001',
    'ОГРН: 1267700310382',
    'Адрес: 119361, г. Москва, пер. 2-й Очаковский, д. 4, помещ. 1/2',
];

/** Фото из public/about; если файла нет — блок просто не показывается. */
function Photo({ src, alt }: (typeof PHOTOS)[number]) {
    const [failed, setFailed] = useState(false);
    const ref = useRef<HTMLImageElement>(null);
    // Картинка могла не загрузиться ещё до гидрации — тогда onError уже не сработает.
    useEffect(() => {
        const img = ref.current;
        if (img && img.complete && img.naturalWidth === 0) setFailed(true);
    }, []);
    if (failed) return null;
    return (
        <figure className={styles.photo}>
            <img ref={ref} src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} />
        </figure>
    );
}

function OperatorLogos() {
    const [partners, setPartners] = useState<HomePartner[]>([]);

    useEffect(() => {
        let cancelled = false;
        getHomePartners()
            .then((rows) => {
                if (!cancelled) setPartners(rows.filter((p) => p.image));
            })
            .catch(() => undefined);
        return () => {
            cancelled = true;
        };
    }, []);

    if (partners.length === 0) return null;

    return (
        <div className={styles.logos}>
            {partners.map((p) => (
                <div key={p.id} className={styles.logoTile}>
                    <img src={p.image} alt={p.name || 'Туроператор'} loading="lazy" decoding="async" />
                </div>
            ))}
        </div>
    );
}

export function AboutContent() {
    return (
        <div className={styles.body}>
            <h2 className={styles.lead}>Ваш гид в мире отдыха: подберём тур и будем рядом всю поездку</h2>
            <p>
                <strong>Totus Club</strong> — сервис для поиска и бронирования туров и отелей. Мы собираем в одной
                выдаче предложения крупных туроператоров, показываем цены и условия до оплаты и помогаем выбрать
                поездку, которая подходит именно вам.
            </p>
            <p>
                Можно купить тур с перелётом или забронировать отель без перелёта. После покупки все документы
                появятся в вашем Аккаунте.
            </p>

            <div className={styles.photos}>
                {PHOTOS.map((photo) => (
                    <Photo key={photo.src} {...photo} />
                ))}
            </div>

            <hr className={styles.divider} />

            <h2 className={styles.sectionTitle}>Что мы делаем</h2>
            {STEPS.map((step, i) => (
                <div key={step.title} className={styles.step}>
                    <h3 className={styles.numHeading}>
                        <span className={styles.num} aria-hidden="true">
                            {i + 1}
                        </span>
                        {step.title}
                    </h3>
                    <p className={styles.stepText}>{step.text}</p>
                </div>
            ))}

            <hr className={styles.divider} />

            <h2 className={styles.sectionTitle}>Туроператоры в нашей выдаче</h2>
            <p>
                Туры формируют и обслуживают туроператоры. Название туроператора видно в карточке тура до оплаты.
            </p>
            <OperatorLogos />
            <p>
                <span className={styles.muted}>А также:</span> Anex, Интурист, ICS Travel
            </p>

            <hr className={styles.divider} />

            <h2 className={styles.sectionTitle}>Компания</h2>
            <p>
                Totus Club — сервис компании ООО «ТОТУСКЛАБ». Мы турагент: помогаем выбрать тур, бронируем его у
                туроператора и остаёмся на связи, пока вы не вернётесь домой.
            </p>
            <p>
                Платить можно картой «Мир» или через СБП. Оплата проходит на странице банка ВТБ, поэтому данные вашей
                карты мы не видим. После оплаты придёт чек.
            </p>
            <p>
                Условия работы сервиса и все документы — на странице{' '}
                <Link href="/legal" className={styles.link}>
                    «Правовая информация»
                </Link>
                .
            </p>
            <div className={styles.requisites}>
                {REQUISITES.map((line) => (
                    <p key={line}>{line}</p>
                ))}
            </div>
        </div>
    );
}
