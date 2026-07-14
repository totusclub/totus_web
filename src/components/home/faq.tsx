import React, { useEffect, useMemo, useState } from "react";
import styles from "./home.module.css";
import Collapse from "@/components/UI/collapse";
import { getFaqItems, type FaqItem } from "@/api/faqApi";

function splitIntoColumns(items: FaqItem[]) {
    const midpoint = Math.ceil(items.length / 2);
    return [items.slice(0, midpoint), items.slice(midpoint)];
}

export default function Faq() {
    const [items, setItems] = useState<FaqItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getFaqItems()
            .then(setItems)
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, []);

    const [leftColumn, rightColumn] = useMemo(() => splitIntoColumns(items), [items]);

    const renderColumn = (columnItems: FaqItem[]) =>
        columnItems.map((item) => (
            <Collapse key={item.id} title={item.question} open={false}>
                <p>{item.answer}</p>
            </Collapse>
        ));

    if (!loading && items.length === 0) {
        return null;
    }

    return (
        <div className={styles.faqBg}>
            <div className={'content'}>
                <div className={styles.faqContainer}>
                    <p>Как можно купить тур в Totus.club?</p>
                    {loading ? (
                        <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--textTertiary)' }}>
                            Загрузка...
                        </p>
                    ) : (
                        <div className={styles.faqRow}>
                            <div className={styles.faqCal}>{renderColumn(leftColumn)}</div>
                            <div className={styles.faqCal}>{renderColumn(rightColumn)}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
