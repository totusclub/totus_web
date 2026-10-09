import React, { useEffect, useState } from "react";
import styles from "./home.module.css";
import { getHomePartners, type HomePartner } from "@/api/homePartnersApi";

function PartnerLogo({ partner }: { partner: HomePartner }) {
    const content = (
        <img
            src={partner.image}
            alt={partner.name || 'Партнёр'}
            loading="lazy"
            decoding="async"
            width={160}
            height={64}
            style={{ width: '100%', height: 'auto', objectFit: 'contain', maxHeight: 80 }}
        />
    );

    if (partner.url) {
        return (
            <a
                href={partner.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.partnerItem}
            >
                {content}
            </a>
        );
    }

    return <div className={styles.partnerItem}>{content}</div>;
}

/** initialPartners — с сервера (главная, getServerSideProps); null — запросить в браузере, как раньше. */
export default function Partner({ initialPartners = null }: { initialPartners?: HomePartner[] | null }) {
    const [partners, setPartners] = useState<HomePartner[]>(initialPartners ?? []);
    const [loading, setLoading] = useState(initialPartners === null);

    useEffect(() => {
        if (initialPartners) return;
        getHomePartners()
            .then(setPartners)
            .catch(() => setPartners([]))
            .finally(() => setLoading(false));
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    if (!loading && partners.length === 0) {
        return null;
    }

    if (loading) {
        return null;
    }

    return (
        <div className={styles.contentFull}>
            <div className={styles.partnerList}>
                {partners.map((partner) => (
                    <PartnerLogo key={partner.id} partner={partner} />
                ))}
            </div>
            {/* Телефон и планшет: горизонтальная прокрутка браузера (было react-slick, свайп листал по 3 логотипа) */}
            <div className={styles.partnerListMob}>
                <div className={`${styles.mobScroller} ${styles.mobScrollerPartners}`}>
                    {partners.map((partner) => (
                        <div key={partner.id} className={styles.mobScrollerItem}>
                            <PartnerLogo partner={partner} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
