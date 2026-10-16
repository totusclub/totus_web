import Link from "next/link";
import styles from './booking.module.css';
import type { InclusionItem } from "@/utils/bookingOffer";

/**
 * Состояния страницы бронирования (макет «Бронирование · ошибки и доп. услуги», утверждён 16.10.2026):
 * тур недоступен, не удалось загрузить, долгая проверка у туроператора, тур продан при оформлении,
 * «Что входит в тур».
 */

type NavLinks = {
    /** /tickets?package=… — нет у отеля без перелёта. */
    otherFlightHref?: string | null;
    /** Страница отеля, с которой пришли; нет — «К поиску туров». */
    roomsHref?: string | null;
};

const PlaneIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 16l20-8-3-2-6 2.4L6 4 4 5l4.5 4.6L5 11l-2-1-1 1 2 3" />
        <path d="M3 21h18" />
    </svg>
);

const RetryIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12a9 9 0 1 1-3-6.7" />
        <path d="M21 4v5h-5" />
    </svg>
);

function RoomsLink({ href, className }: { href?: string | null; className: string }) {
    return (
        <Link href={href || '/'} className={className}>
            {href ? 'Вернуться к номерам' : 'К поиску туров'}
        </Link>
    );
}

/** Тур снят / продан / протух — при открытии страницы. */
export function BookingUnavailable({ summary, otherFlightHref, roomsHref }: NavLinks & { summary?: string }) {
    return (
        <section className={styles.bookingStatus} role="alert" data-booking-state="unavailable">
            <div className={`${styles.bookingStatusIcon} ${styles.bookingStatusIconAccent}`}>
                <PlaneIcon size={28} />
            </div>
            <h1 className={styles.bookingStatusTitle}>Это предложение больше недоступно</h1>
            <p className={styles.bookingStatusText}>
                {otherFlightHref
                    ? 'Туроператор снял тур или изменил условия, пока вы выбирали. Цены и места меняются каждую минуту — подберите другой перелёт к этому отелю или другой номер.'
                    : 'Отель снял предложение или изменил условия, пока вы выбирали. Цены и места меняются каждую минуту — подберите другой номер.'}
            </p>
            {summary ? <p className={styles.bookingStatusMeta}>{summary}</p> : null}
            <div className={styles.bookingStatusActions}>
                {otherFlightHref ? (
                    <>
                        <Link href={otherFlightHref} className={styles.bookingBtnPrimary}>Выбрать другой перелёт</Link>
                        <RoomsLink href={roomsHref} className={styles.bookingBtnSecondary} />
                    </>
                ) : (
                    <RoomsLink href={roomsHref} className={styles.bookingBtnPrimary} />
                )}
            </div>
        </section>
    );
}

/** Сбой связи или туроператора — тур может быть доступен, можно повторить. */
export function BookingLoadError({ onRetry, otherFlightHref, roomsHref }: NavLinks & { onRetry: () => void }) {
    return (
        <section className={styles.bookingStatus} role="alert" data-booking-state="error">
            <div className={styles.bookingStatusIcon}>
                <RetryIcon size={28} />
            </div>
            <h1 className={styles.bookingStatusTitle}>Не удалось загрузить тур</h1>
            <p className={styles.bookingStatusText}>
                Туроператор отвечает дольше обычного или пропала связь. Тур при этом может быть доступен — попробуйте ещё раз через несколько секунд.
            </p>
            <div className={styles.bookingStatusActions}>
                <button type="button" className={styles.bookingBtnPrimary} onClick={onRetry}>Повторить</button>
                {otherFlightHref ? (
                    <Link href={otherFlightHref} className={styles.bookingBtnSecondary}>Выбрать другой перелёт</Link>
                ) : (
                    <RoomsLink href={roomsHref} className={styles.bookingBtnSecondary} />
                )}
            </div>
            <p className={styles.bookingStatusFootnote}>
                Не получается несколько раз подряд — напишите в чат поддержки, поможем оформить.
            </p>
        </section>
    );
}

/** Подсказка в карточке заказа, если актуализация идёт дольше BOOKING_SLOW_HINT_MS. */
export function BookingSlowHint() {
    return (
        <div className={styles.bookingSlowHint} role="status" aria-live="polite">
            <span className={styles.bookingSlowSpinner} aria-hidden="true" />
            <div>
                <p className={styles.bookingSlowHintTitle}>Проверяем цену и места у туроператора</p>
                <p className={styles.bookingSlowHintText}>Обычно это 5–15 секунд. Не закрывайте страницу.</p>
            </div>
        </div>
    );
}

/** Тур продали, пока заполняли форму (актуализация перед созданием заказа). */
export function BookingSubmitUnavailable({ otherFlightHref, roomsHref }: NavLinks) {
    return (
        <div className={styles.bookingSubmitAlert} role="alert" data-booking-state="sold-out">
            <p className={styles.bookingSubmitAlertTitle}>Этот тур только что раскупили</p>
            <p className={styles.bookingSubmitAlertText}>
                Пока вы заполняли данные, туроператор продал места или изменил условия. Заказ не создан, деньги не списаны.
            </p>
            <div className={styles.bookingSubmitAlertActions}>
                {otherFlightHref ? (
                    <Link href={otherFlightHref} className={styles.bookingBtnPrimarySmall}>Выбрать другой перелёт</Link>
                ) : null}
                <Link href={roomsHref || '/'} className={otherFlightHref ? styles.bookingBtnSecondarySmall : styles.bookingBtnPrimarySmall}>
                    {roomsHref ? 'К номерам' : 'К поиску туров'}
                </Link>
            </div>
        </div>
    );
}

const CheckIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
);
const DashIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
        <path d="M6 12h12" />
    </svg>
);
const InfoIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6" />
        <path d="M12 7.5v.5" />
    </svg>
);

const KIND_LABEL: Record<InclusionItem['kind'], string> = {
    yes: 'Входит',
    no: 'Не входит',
    info: 'Важно',
};

/** «Что входит в тур» под «Итого» в карточке заказа. */
export function BookingInclusions({ items, title }: { items: InclusionItem[]; title: string }) {
    if (items.length === 0) return null;
    return (
        <div className={styles.bookingInclusions}>
            <p className={styles.bookingInclusionsTitle}>{title}</p>
            <ul className={styles.bookingInclusionsList}>
                {items.map((item) => (
                    <li key={item.key} className={styles.bookingInclusion} data-kind={item.kind}>
                        <span className={styles.bookingInclusionIcon} title={KIND_LABEL[item.kind]}>
                            {item.kind === 'yes' ? <CheckIcon /> : item.kind === 'no' ? <DashIcon /> : <InfoIcon />}
                        </span>
                        <span className={styles.bookingInclusionText}>
                            <span className={styles.srOnly}>{KIND_LABEL[item.kind]}: </span>
                            {item.title}
                            {item.note ? <span className={styles.bookingInclusionNote}> {item.note}</span> : null}
                            {item.detail ? <span className={styles.bookingInclusionDetail}>{item.detail}</span> : null}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
