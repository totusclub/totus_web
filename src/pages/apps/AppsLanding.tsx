"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import Icon from "@/components/icons/Icon";
import AppStoreIcon from "@/components/icons/appStore";
import GooglePlayIcon from "@/components/icons/googlePlay";
import shell from "@/components/staticInfoPage/staticInfoPage.module.css";
import styles from "./appsLanding.module.css";

const IOS_STORE_URL = process.env.NEXT_PUBLIC_APP_STORE_URL?.trim() || "";
const ANDROID_STORE_URL = process.env.NEXT_PUBLIC_GOOGLE_PLAY_URL?.trim() || "";

const EASE = [0.22, 1, 0.36, 1] as const;

const MARQUEE = [
    "Поиск туров и отелей",
    "Синхронизация с сайтом",
    "Избранное в один тап",
    "Заказы и статусы",
    "Личный кабинет",
    "Totus Club",
    "Путешествия без лишних шагов",
];

function StoreBadges({ className }: { className?: string }) {
    return (
        <div className={`${styles.storeRow} ${className ?? ""}`}>
            {IOS_STORE_URL ? (
                <motion.a
                    className={styles.storeLink}
                    href={IOS_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Скачать в App Store"
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <AppStoreIcon width={138} height={46} />
                </motion.a>
            ) : (
                <span className={styles.storeSoon} title="Задайте NEXT_PUBLIC_APP_STORE_URL">
                    <AppStoreIcon width={138} height={46} />
                </span>
            )}
            {ANDROID_STORE_URL ? (
                <motion.a
                    className={styles.storeLink}
                    href={ANDROID_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Скачать в Google Play"
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <GooglePlayIcon width={138} height={46} />
                </motion.a>
            ) : (
                <span className={styles.storeSoon} title="Задайте NEXT_PUBLIC_GOOGLE_PLAY_URL">
                    <GooglePlayIcon width={138} height={46} />
                </span>
            )}
        </div>
    );
}

export default function AppsLanding() {
    const reduce = useReducedMotion();

    const fadeBlock = (delay = 0) =>
        reduce
            ? {
                  initial: { opacity: 1, y: 0 },
                  whileInView: { opacity: 1, y: 0 },
                  transition: { duration: 0 },
              }
            : {
                  initial: { opacity: 0, y: 32 },
                  whileInView: { opacity: 1, y: 0 },
                  viewport: { once: true, amount: 0.2 },
                  transition: { duration: 0.62, delay, ease: EASE },
              };

    const phoneMotion = reduce
        ? {}
        : {
              initial: { opacity: 0, rotateX: 12, y: 40, scale: 0.92 },
              whileInView: { opacity: 1, rotateX: 0, y: 0, scale: 1 },
              viewport: { once: true, amount: 0.35 },
              transition: { type: "spring" as const, stiffness: 86, damping: 18, mass: 0.85 },
          };

    return (
        <main className={"searchContainer"}>
            <div className={"content"}>
                <div className={styles.shell}>
                    <div
                        className={shell.breadcrumbBar}
                    >
                        <Link href="/" className={shell.crumbLink}>
                            Главная
                        </Link>
                        <span className={shell.sep} aria-hidden="true">
                            &gt;
                        </span>
                        <span className={shell.crumbCurrent} aria-current="page">
                            Приложения
                        </span>
                    </div>

                    {/* Stage: mesh + asymmetric copy / glass + device */}
                    <motion.section className={styles.stage} aria-labelledby="apps-hero-title" {...fadeBlock(0)}>
                        <div className={styles.stageGlow} aria-hidden="true" />
                        <div className={styles.stageMesh} aria-hidden="true" />
                        <div className={styles.stageInner}>
                            <div className={styles.stageLeft}>
                                <div className={styles.overline}>
                                    <span className={styles.overlineLine} aria-hidden="true" />
                                    Мобильный клиент
                                </div>
                                <h1 id="apps-hero-title" className={styles.headline}>
                                    <span className={styles.headlineGrad}>Totus Club</span>
                                    <span style={{ display: "block", marginTop: "0.06em" }}>
                                        путешествия без трения
                                    </span>
                                </h1>
                                <p className={styles.sub}>
                                    Один аккаунт с сайтом: ищите туры и отели, сохраняйте в избранное, следите за
                                    заказами — в дороге так же удобно, как дома.
                                </p>
                                <StoreBadges />
                            </div>

                            <div className={styles.stageRight}>
                                <div className={styles.glassStack} aria-hidden="true">
                                    <div className={styles.glassCard}>
                                        <strong>Мгновенный доступ</strong>
                                        <span>К поиску и профилю с первого экрана</span>
                                    </div>
                                    <div className={styles.glassCard}>
                                        <strong>Единый профиль</strong>
                                        <span>Данные и заказы синхронизируются с веб-версией</span>
                                    </div>
                                    <div className={styles.glassCard}>
                                        <strong>Готовность к поездке</strong>
                                        <span>Карточки отелей с фото и ключевыми деталями</span>
                                    </div>
                                </div>

                                <motion.div className={styles.phoneStage} {...phoneMotion}>
                                    <div className={styles.phone}>
                                        <div className={styles.phoneNotch} />
                                        <div className={styles.phoneScreen}>
                                            <Image
                                                src="/images/totus-app-home.png"
                                                alt="Скриншот приложения Totus Club: поиск туров, главный экран"
                                                fill
                                                className={styles.phoneScreenImg}
                                                sizes="(max-width: 520px) 170px, 200px"
                                                priority
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </motion.section>

                    {/* Infinite marquee */}
                    <motion.div className={styles.marqueeWrap} aria-hidden="true" {...fadeBlock(0.06)}>
                        <div className={styles.marquee}>
                            <div className={styles.marqueeTrack}>
                                {MARQUEE.map((t, i) => (
                                    <span key={`m-a-${i}`} className={styles.marqueeItem}>
                                        {t}
                                    </span>
                                ))}
                            </div>
                            <div className={styles.marqueeTrack}>
                                {MARQUEE.map((t, i) => (
                                    <span key={`m-b-${i}`} className={styles.marqueeItem}>
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    <p className={styles.sectionLabel}>Возможности</p>
                    <motion.div className={styles.bento} {...fadeBlock(0.08)}>
                        <motion.article
                            className={`${styles.bentoCell} ${styles.bentoTall}`}
                            whileHover={reduce ? undefined : { y: -4 }}
                            transition={{ type: "spring", stiffness: 400, damping: 28 }}
                        >
                            <div>
                                <div className={styles.bentoIcon}>
                                    <Icon name="search" size={26} color="var(--core_Orange)" />
                                </div>
                                <h2 className={styles.bentoTitle}>Поиск, который держит ритм</h2>
                                <p className={styles.bentoText}>
                                    Даты, направления и фильтры — быстрый путь от идеи до списка подходящих туров и
                                    отелей.
                                </p>
                            </div>
                            <span className={styles.bentoNum} aria-hidden="true">
                                01
                            </span>
                        </motion.article>
                        <motion.article
                            className={styles.bentoCell}
                            whileHover={reduce ? undefined : { y: -4 }}
                            transition={{ type: "spring", stiffness: 400, damping: 28 }}
                        >
                            <div className={styles.bentoIcon}>
                                <Icon name="heart" size={24} color="var(--core_Orange)" />
                            </div>
                            <h2 className={styles.bentoTitle}>Избранное</h2>
                            <p className={styles.bentoText}>Собирайте варианты и возвращайтесь, когда время бронировать.</p>
                        </motion.article>
                        <motion.article
                            className={styles.bentoCell}
                            whileHover={reduce ? undefined : { y: -4 }}
                            transition={{ type: "spring", stiffness: 400, damping: 28 }}
                        >
                            <div className={styles.bentoIcon}>
                                <Icon name="order" size={24} color="var(--core_Orange)" />
                            </div>
                            <h2 className={styles.bentoTitle}>Заказы</h2>
                            <p className={styles.bentoText}>Статусы и детали бронирований всегда под рукой.</p>
                        </motion.article>
                        <motion.article
                            className={`${styles.bentoCell} ${styles.bentoWide}`}
                            whileHover={reduce ? undefined : { y: -3 }}
                            transition={{ type: "spring", stiffness: 400, damping: 28 }}
                        >
                            <div className={styles.bentoIcon}>
                                <Icon name="hotel" size={26} color="var(--core_Orange)" />
                            </div>
                            <div>
                                <h2 className={styles.bentoTitle}>Карточка отеля</h2>
                                <p className={styles.bentoText}>
                                    Фото, удобства и номера — всё для уверенного выбора перед поездкой, в том же стиле,
                                    что и на сайте Totus Club.
                                </p>
                            </div>
                        </motion.article>
                    </motion.div>

                    <motion.div className={styles.split} {...fadeBlock(0.1)}>
                        <div className={styles.splitCard}>
                            <h2 className={styles.splitTitle}>Для путешественников</h2>
                            <ul className={styles.splitList}>
                                <li>
                                    <span className={styles.splitDot} aria-hidden="true" />
                                    Единый вход: веб и приложение используют один аккаунт.
                                </li>
                                <li>
                                    <span className={styles.splitDot} aria-hidden="true" />
                                    Меньше шагов от поиска к понятному результату.
                                </li>
                                <li>
                                    <span className={styles.splitDot} aria-hidden="true" />
                                    Данные обрабатываются согласно политике конфиденциальности.
                                </li>
                            </ul>
                        </div>
                        <div className={styles.splitCard}>
                            <h2 className={styles.splitTitle}>Скоро и глубже</h2>
                            <ul className={styles.splitList}>
                                <li>
                                    <span className={styles.splitDot} aria-hidden="true" />
                                    Уведомления о статусе заказа и важных этапах поездки.
                                </li>
                                <li>
                                    <span className={styles.splitDot} aria-hidden="true" />
                                    Дополнительные сценарии для постоянных клиентов клуба.
                                </li>
                                <li>
                                    <span className={styles.splitDot} aria-hidden="true" />
                                    Регулярные обновления интерфейса и стабильности.
                                </li>
                            </ul>
                        </div>
                    </motion.div>

                    <motion.section className={styles.ribbon} aria-labelledby="apps-cta-title" {...fadeBlock(0.12)}>
                        <div className={styles.ribbonBg} aria-hidden="true" />
                        <div className={styles.ribbonNoise} aria-hidden="true" />
                        <div className={styles.ribbonInner}>
                            <h2 id="apps-cta-title" className={styles.ribbonTitle}>
                                Установите приложение
                            </h2>
                            <p className={styles.ribbonText}>
                                Выберите магазин на вашем телефоне — и планируйте следующую поездку с Totus Club.
                            </p>
                            <StoreBadges />
                            <p className={styles.envHint}>
                                Ссылки на сборки:{" "}
                                <code>NEXT_PUBLIC_APP_STORE_URL</code> и <code>NEXT_PUBLIC_GOOGLE_PLAY_URL</code>
                            </p>
                        </div>
                    </motion.section>
                </div>
            </div>
        </main>
    );
}
