import type { ReactNode } from 'react';
import { LEGAL_LINKS } from '@/config/legalLinks';
import styles from './consentCheckbox.module.css';

// Чекбоксы согласий под формами (макет «Согласия в формах», утверждён 14.10.2026).
// Не отмечены по умолчанию; ссылки открываются в новой вкладке, чтобы не терять заполненную форму.

type ConsentCheckboxProps = {
    id: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    children: ReactNode;
    /** onAccent — на оранжевом фоне (блок «Оставьте номер» на главной). */
    variant?: 'default' | 'onAccent';
    required?: boolean;
};

export default function ConsentCheckbox({ id, checked, onChange, children, variant = 'default', required }: ConsentCheckboxProps) {
    return (
        <label htmlFor={id} className={`${styles.consent} ${variant === 'onAccent' ? styles.onAccent : ''}`}>
            <input
                id={id}
                type="checkbox"
                className={styles.box}
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                aria-required={required ? true : undefined}
            />
            <span className={styles.text}>{children}</span>
        </label>
    );
}

export function DocLink({ href, children }: { href: string; children: ReactNode }) {
    return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={styles.link}>
            {children}
        </a>
    );
}

/** [С] Согласие на обработку персональных данных. subjects — данные туристов (тур) или гостей (отель) в заказе. */
export function ConsentPdText({ subjects }: { subjects?: 'tourists' | 'guests' }) {
    return (
        <>
            Я даю <DocLink href={LEGAL_LINKS.consent}>согласие на обработку персональных данных</DocLink>
            {subjects === 'tourists' ? ', в том числе данных туристов, указанных в заказе, — с их согласия,' : null}
            {subjects === 'guests' ? ', в том числе данных гостей, указанных в заказе, — с их согласия,' : null} и
            ознакомлен(а) с <DocLink href={LEGAL_LINKS.privacy}>Политикой обработки персональных данных</DocLink>
        </>
    );
}

/** [Р] Реклама — всегда необязательно. */
export function ConsentAdsText() {
    return (
        <>
            Хочу получать спецпредложения и новости Totus Club.{' '}
            <DocLink href={LEGAL_LINKS.adsConsent}>Согласие на получение рекламы</DocLink>
        </>
    );
}

/** [О] Оферта на тур: п. 1.3 оферты — договор заключается отметкой и оплатой. */
export function ConsentTourOfferText() {
    return (
        <>
            Я ознакомлен(а) и принимаю{' '}
            <DocLink href={LEGAL_LINKS.tourOffer}>Оферту о заключении договора о реализации туристского продукта</DocLink>,
            условия <DocLink href={LEGAL_LINKS.cancellation}>изменения, отмены и возврата</DocLink> и{' '}
            <DocLink href={LEGAL_LINKS.payment}>оплаты</DocLink>, а также{' '}
            <DocLink href={LEGAL_LINKS.touristMemo}>Памятку туристу</DocLink> и сведения о туроператоре в заказе
        </>
    );
}

/** [Б] Отель без перелёта — не тур: свои условия бронирования размещения. */
export function ConsentHotelTermsText() {
    return (
        <>
            Я ознакомлен(а) и принимаю <DocLink href={LEGAL_LINKS.hotelBooking}>Условия бронирования размещения</DocLink>,
            правила отмены выбранного тарифа и условия <DocLink href={LEGAL_LINKS.payment}>оплаты</DocLink>
        </>
    );
}

/** [У] Пользовательское соглашение принимается самим действием. */
export function TermsNote({ verb, withPrivacy }: { verb: 'Регистрируясь' | 'Продолжая'; withPrivacy?: boolean }) {
    return (
        <p className={styles.note}>
            {verb}, вы принимаете <DocLink href={LEGAL_LINKS.terms}>Пользовательское соглашение</DocLink>
            {withPrivacy ? (
                <>
                    . <DocLink href={LEGAL_LINKS.privacy}>Политика обработки персональных данных</DocLink>
                </>
            ) : null}
        </p>
    );
}

/** Подсказка под неактивной кнопкой. */
export function ConsentHint({ children, variant = 'default' }: { children: ReactNode; variant?: 'default' | 'onAccent' }) {
    return <p className={`${styles.hint} ${variant === 'onAccent' ? styles.hintOnAccent : ''}`}>{children}</p>;
}

/** Несколько чекбоксов подряд. */
export function ConsentGroup({ children }: { children: ReactNode }) {
    return <div className={styles.group}>{children}</div>;
}
