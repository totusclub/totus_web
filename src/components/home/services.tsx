import React, { useState } from "react";
import styles from "./home.module.css";
const categories = [
    {
        name: "Туры под ключ",
        imagesLeft: ['http://localhost:3000/images/left1.png'],
        imagesRight: ['http://localhost:3000/images/list2.png', 'http://localhost:3000/images/b3.png'],
    },
    {
        name: "Поддержка 24/7",
        imagesLeft: ['http://localhost:3000/images/left1.png'],
        imagesRight: ['http://localhost:3000/images/left1.png', 'http://localhost:3000/images/b3.png']
    },
    {
        name: "Выгодные цены",
        imagesLeft: ['http://localhost:3000/images/left1.png'],
        imagesRight: ['http://localhost:3000/images/left1.png', 'http://localhost:3000/images/b3.png']
    },
    {
        name: "Надёжные партнёры",
        imagesLeft: ['http://localhost:3000/images/left1.png'],
        imagesRight: ['http://localhost:3000/images/left1.png', 'http://localhost:3000/images/b3.png']
    },
    {
        name: "Быстрое оформление",
        imagesLeft: ['http://localhost:3000/images/left1.png'],
        imagesRight: ['http://localhost:3000/images/left1.png', 'http://localhost:3000/images/b3.png']}
];

export default function Services() {
    const [activeIndex, setActiveIndex] = useState<number | null>(0);

    return (
        <div className={styles.serviceWrap}>
            <div className={styles.containerS}>
                {activeIndex !== null && (
                    <div className={styles.leftImages}>
                        <div
                            className={styles.imageItemLeft}
                            style={{
                                backgroundImage: `url(${categories[activeIndex].imagesLeft[0]})`,
                            }}
                        />
                    </div>
                )}
                <div className={styles.categoryList}>
                    {categories.map((cat, idx) => (
                        <div
                            key={idx}
                            className={styles.categoryItem}
                        >
                            <p
                                style={{color: idx === activeIndex ? "#e86e40" : "var(--textPrimary)"}}
                                onMouseEnter={() => {
                                    setActiveIndex(null)
                                    setTimeout(() => {
                                        setActiveIndex(idx)
                                    }, 200)
                                }}>{cat.name}</p>
                        </div>
                    ))}
                </div>

                {activeIndex !== null && (
                    <div className={styles.rightImages}>
                        {categories[activeIndex].imagesRight.map((src, i) => (
                            <div style={{
                                display: 'flex',
                                width: "100%",
                                justifyContent: i === 1 ? 'flex-end' : 'flex-start'
                            }}>
                                <div
                                    key={i}
                                    className={styles[`imageItem_${i}`]}
                                    style={{backgroundImage: `url(${src})`}}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className={styles.containerM}>
                <div className={styles.tabList}>
                    {categories.map((tab, index) => (
                        <button
                            key={index}
                            className={`${styles.tabButton} ${activeIndex === index ? styles.active : ''}`}
                            onClick={() => setActiveIndex(index)}
                        >
                            {tab.name}
                        </button>
                    ))}
                </div>
                <div className={styles.tabContent}>
                    <div className={styles.tabContentImgRow}>
                        <div className={styles.tabContentImg}  style={{
                            backgroundImage: `url(${categories[activeIndex]?.imagesRight[0]})`,
                        }}></div>
                        <div className={styles.tabContentImg} style={{
                            backgroundImage: `url(${categories[activeIndex]?.imagesRight[1]})`,
                        }}></div>
                    </div>
                    <div className={styles.tabContentImg} style={{
                        backgroundImage: `url(${categories[activeIndex]?.imagesLeft[0]})`,
                    }}></div>
                </div>
            </div>

        </div>
    );
}
