import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import styles from "./home.module.css";
import { getHomePartners, type HomePartner } from "@/api/homePartnersApi";

const sliderSettings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    initialSlide: 0,
    responsive: [
        {
            breakpoint: 1026,
            settings: {
                slidesToShow: 5,
                slidesToScroll: 3,
                infinite: true,
                dots: false,
            },
        },
        {
            breakpoint: 600,
            settings: {
                slidesToShow: 2,
                slidesToScroll: 2,
                initialSlide: 2,
            },
        },
        {
            breakpoint: 480,
            settings: {
                slidesToShow: 2.7,
                slidesToScroll: 3,
                dots: false,
                arrows: false,
            },
        },
    ],
};

function PartnerLogo({ partner }: { partner: HomePartner }) {
    const content = (
        <img
            src={partner.image}
            alt={partner.name || 'Партнёр'}
            loading="lazy"
            decoding="async"
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

export default function Partner() {
    const [partners, setPartners] = useState<HomePartner[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getHomePartners()
            .then(setPartners)
            .catch(() => setPartners([]))
            .finally(() => setLoading(false));
    }, []);

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
            <div className={styles.partnerListMob}>
                <Slider {...sliderSettings}>
                    {partners.map((partner) => (
                        <div key={partner.id} className={styles.partnerItemMob}>
                            <PartnerLogo partner={partner} />
                        </div>
                    ))}
                </Slider>
            </div>
        </div>
    );
}
