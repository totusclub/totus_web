import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./staticInfoPage.module.css";
import Icon from "@/components/icons/Icon";

export type StaticInfoSection = "company" | "contact" | "more" | "legal";

const SECTION_DEFAULT_MID: Record<StaticInfoSection, string> = {
    company: "Компания",
    contact: "Контакт",
    more: "Еще",
    legal: "Документы",
};

export type StaticInfoPageProps = {
    title: string;
    section: StaticInfoSection;
    currentLabel: string;
    /** Overrides middle breadcrumb label (default is from section). */
    breadcrumbMid?: string;
    /** Без общей белой карточки и заголовка: страница сама рисует блоки и свой h1 (центр помощи /help-faq). */
    plain?: boolean;
    children: ReactNode;
};

export function StaticInfoPage({
    title,
    section,
    currentLabel,
    breadcrumbMid,
    plain = false,
    children,
}: StaticInfoPageProps) {
    const mid = breadcrumbMid ?? SECTION_DEFAULT_MID[section];

    return (
        <main className={"searchContainer"}>
            <div className={"content"}>
                <div className={styles.wrap}>
                    <nav className={styles.breadcrumbBar} aria-label="Хлебные крошки">
                        <Link href="/" className={styles.crumbLink}>
                            Главная
                        </Link>
                        <span className={styles.sep} aria-hidden="true">
                            <Icon name="rightArrow" />
                        </span>
                        <span className={styles.crumbInactive}>{mid}</span>
                        <span className={styles.sep} aria-hidden="true">
                            <Icon name="rightArrow" />
                        </span>
                        <span className={styles.crumbCurrent} aria-current="page">
                            {currentLabel}
                        </span>
                    </nav>

                    {plain ? (
                        children
                    ) : (
                        <article className={styles.card}>
                            <h1 className={styles.title}>{title}</h1>
                            {children}
                        </article>
                    )}
                </div>
            </div>
        </main>
    );
}
