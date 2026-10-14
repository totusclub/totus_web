'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { getHomePartners, type HomePartner } from '@/api/homePartnersApi';
import { submitPartnerRequest, type PartnerKind } from '@/api/partnerRequestApi';
import { HelpIcon, type HelpIconName } from './helpIcons';
import styles from './infoPages.module.css';

// Страница /partners — макет Figma «Партнёры» (секция 2422:109219, 14.10.2026).
// Заявка из формы сохраняется в totus_API и видна в админке, раздел «Заявки партнёров».

const ANCHORS = [
    { id: 'partners-operators', label: 'Туроператоры' },
    { id: 'partners-payments', label: 'Приём платежей' },
    { id: 'partners-join', label: 'Стать партнёром' },
];

const ALSO = ['Anex', 'Интурист', 'ICS Travel'];

const AUDIENCE: { icon: HelpIconName; title: string; text: string }[] = [
    { icon: 'plane', title: 'Туроператорам', text: 'Подключение туров и спецпредложений к выдаче Totus Club.' },
    { icon: 'hotel', title: 'Отелям', text: 'Прямые предложения номеров и акции для гостей.' },
    { icon: 'megaphone', title: 'Рекламодателям', text: 'Размещение на сайте, в приложениях и рассылках.' },
];

export const PARTNER_KINDS: { value: PartnerKind; label: string }[] = [
    { value: 'operator', label: 'Туроператор' },
    { value: 'hotel', label: 'Отель' },
    { value: 'ads', label: 'Реклама' },
    { value: 'other', label: 'Другое' },
];

type Fields = { company: string; name: string; email: string; phone: string; message: string };
type FieldErrors = Partial<Record<keyof Fields, string>>;

const EMPTY: Fields = { company: '', name: '', email: '', phone: '', message: '' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const MESSAGE_MAX = 2000;

/** Та же проверка, что на сервере (totus_API, partnerRequests.controller). */
export function validatePartnerForm(f: Fields): FieldErrors {
    const errors: FieldErrors = {};
    if (f.company.trim().length < 2) errors.company = 'Укажите название компании';
    if (f.name.trim().length < 2) errors.name = 'Укажите ваше имя';
    if (!f.email.trim()) errors.email = 'Укажите электронную почту';
    else if (!EMAIL_RE.test(f.email.trim())) errors.email = 'Проверьте адрес электронной почты';
    const digits = f.phone.replace(/\D/g, '');
    if (f.phone.trim() && (digits.length < 10 || digits.length > 15)) errors.phone = 'Проверьте номер телефона';
    if (f.message.length > MESSAGE_MAX) errors.message = `Не больше ${MESSAGE_MAX} символов`;
    return errors;
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
        <div className={styles.partnerLogos}>
            {partners.map((p) => (
                <div key={p.id} className={styles.partnerLogo}>
                    <img src={p.image} alt={p.name || 'Туроператор'} loading="lazy" decoding="async" />
                </div>
            ))}
        </div>
    );
}

function Field({
    id,
    label,
    error,
    children,
}: {
    id: string;
    label: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <div className={styles.formField}>
            <label htmlFor={id} className={styles.visuallyHidden}>
                {label}
            </label>
            {children}
            {error ? (
                <span id={`${id}-error`} className={styles.fieldError}>
                    {error}
                </span>
            ) : null}
        </div>
    );
}

function PartnerForm() {
    const [fields, setFields] = useState<Fields>(EMPTY);
    const [kind, setKind] = useState<PartnerKind>('operator');
    const [website, setWebsite] = useState('');
    const [errors, setErrors] = useState<FieldErrors>({});
    const [sending, setSending] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [sentTo, setSentTo] = useState<string | null>(null);
    const doneRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (sentTo) doneRef.current?.focus();
    }, [sentTo]);

    const set = (key: keyof Fields) => (e: { target: { value: string } }) => {
        const value = e.target.value;
        setFields((f) => ({ ...f, [key]: value }));
        if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
    };

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (sending) return;
        const found = validatePartnerForm(fields);
        setErrors(found);
        setServerError(null);
        const first = (Object.keys(found) as (keyof Fields)[])[0];
        if (first) {
            document.getElementById(`partner-${first}`)?.focus();
            return;
        }
        setSending(true);
        try {
            await submitPartnerRequest({
                company: fields.company.trim(),
                name: fields.name.trim(),
                email: fields.email.trim(),
                phone: fields.phone.trim(),
                kind,
                message: fields.message.trim(),
                website,
            });
            setSentTo(fields.email.trim());
            setFields(EMPTY);
        } catch (err) {
            setServerError(err instanceof Error ? err.message : 'Не удалось отправить заявку, попробуйте позже');
        } finally {
            setSending(false);
        }
    };

    if (sentTo) {
        return (
            <div className={`${styles.partnerForm} ${styles.partnerDone}`} ref={doneRef} tabIndex={-1} role="status">
                <span className={styles.partnerIcon}>
                    <HelpIcon name="check" />
                </span>
                <h3 className={styles.partnerDoneTitle}>Заявка отправлена</h3>
                <p className={styles.helpMuted}>
                    Спасибо! Мы изучим предложение и ответим на почту {sentTo}.
                </p>
                <button type="button" className={styles.btnSecondary} onClick={() => setSentTo(null)}>
                    Отправить ещё одну
                </button>
            </div>
        );
    }

    const input = (key: keyof Fields, placeholder: string, type = 'text', autoComplete?: string) => (
        <Field id={`partner-${key}`} label={placeholder} error={errors[key]}>
            <input
                id={`partner-${key}`}
                name={key}
                type={type}
                value={fields[key]}
                onChange={set(key)}
                placeholder={placeholder}
                autoComplete={autoComplete}
                className={`${styles.formInput} ${errors[key] ? styles.formInputError : ''}`}
                aria-invalid={errors[key] ? true : undefined}
                aria-describedby={errors[key] ? `partner-${key}-error` : undefined}
                maxLength={key === 'email' || key === 'company' ? 200 : key === 'phone' ? 32 : 120}
            />
        </Field>
    );

    return (
        <form className={styles.partnerForm} onSubmit={onSubmit} noValidate aria-label="Заявка на партнёрство">
            <div className={styles.formRow}>
                {input('company', 'Компания', 'text', 'organization')}
                {input('name', 'Ваше имя', 'text', 'name')}
            </div>
            <div className={styles.formRow}>
                {input('email', 'Электронная почта', 'email', 'email')}
                {input('phone', 'Телефон (необязательно)', 'tel', 'tel')}
            </div>

            <div className={styles.chips} role="radiogroup" aria-label="Кто вы">
                <span className={styles.chipsLabel}>Вы:</span>
                {PARTNER_KINDS.map((k) => (
                    <button
                        key={k.value}
                        type="button"
                        role="radio"
                        aria-checked={kind === k.value}
                        className={`${styles.chip} ${styles.chipOnSecondary} ${kind === k.value ? styles.chipActive : ''}`}
                        onClick={() => setKind(k.value)}
                    >
                        {k.label}
                    </button>
                ))}
            </div>

            <Field id="partner-message" label="Коротко о предложении" error={errors.message}>
                <textarea
                    id="partner-message"
                    name="message"
                    value={fields.message}
                    onChange={set('message')}
                    placeholder="Коротко о предложении"
                    rows={4}
                    maxLength={MESSAGE_MAX}
                    className={`${styles.formInput} ${styles.formTextarea} ${errors.message ? styles.formInputError : ''}`}
                    aria-invalid={errors.message ? true : undefined}
                />
            </Field>

            {/* Ловушка для ботов: поле скрыто от людей и программ чтения экрана. */}
            <input
                type="text"
                name="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className={styles.honeypot}
            />

            {serverError ? (
                <p className={styles.formError} role="alert">
                    {serverError}
                </p>
            ) : null}

            <button type="submit" className={`${styles.btnPrimary} ${styles.formSubmit}`} disabled={sending}>
                {sending ? 'Отправляем…' : 'Отправить заявку'}
            </button>
            <p className={styles.formNote}>
                Нажимая кнопку, вы соглашаетесь с{' '}
                <Link href="/privacy-policy" className={styles.link}>
                    Политикой обработки персональных данных
                </Link>
                .
            </p>
        </form>
    );
}

export function PartnersContent() {
    return (
        <div className={styles.help}>
            <section className={styles.helpHero}>
                <h1 className={styles.helpTitle}>Партнёры Totus Club</h1>
                <p className={styles.helpMuted}>
                    Мы работаем с крупными туроператорами и надёжными сервисами, чтобы вы могли выбрать тур, оплатить
                    его и спокойно провести отпуск в одном месте.
                </p>
                <nav className={`${styles.chips} ${styles.heroAnchors}`} aria-label="На странице">
                    <span className={styles.chipsLabel}>На странице:</span>
                    {ANCHORS.map((a) => (
                        <a key={a.id} href={`#${a.id}`} className={styles.chip}>
                            {a.label}
                        </a>
                    ))}
                </nav>
            </section>

            <section id="partners-operators" className={`${styles.helpCard} ${styles.partnerSection}`}>
                <h2 className={styles.helpCardTitle}>Туроператоры</h2>
                <p className={styles.helpMuted}>
                    Туры в выдаче формируют и обслуживают туроператоры. Название туроператора видно в карточке тура до
                    оплаты.
                </p>
                <OperatorLogos />
                <div className={styles.chips}>
                    <span className={styles.chipsLabel}>А также:</span>
                    {ALSO.map((n) => (
                        <span key={n} className={`${styles.chip} ${styles.chipStatic}`}>
                            {n}
                        </span>
                    ))}
                </div>
            </section>

            <section id="partners-payments" className={`${styles.helpCard} ${styles.partnerSection}`}>
                <h2 className={styles.helpCardTitle}>Приём платежей</h2>
                <div className={styles.bankRow}>
                    <span className={styles.partnerIcon}>
                        <HelpIcon name="card" />
                    </span>
                    <div className={styles.bankText}>
                        <h3 className={styles.partnerItemTitle}>Банк ВТБ (ПАО)</h3>
                        <p className={styles.partnerItemText}>
                            Принимает оплату картой «Мир» и через Систему быстрых платежей. Данные карты вы вводите на
                            странице банка — Totus Club их не получает и не хранит.
                        </p>
                    </div>
                    <div className={styles.bankBadges}>
                        <span className={`${styles.chip} ${styles.chipStatic} ${styles.chipOnSecondary}`}>Мир</span>
                        <span className={`${styles.chip} ${styles.chipStatic} ${styles.chipOnSecondary}`}>СБП</span>
                    </div>
                </div>
            </section>

            <section id="partners-join" className={`${styles.helpCard} ${styles.partnerSection} ${styles.joinCard}`}>
                <div className={styles.joinAbout}>
                    <h2 className={styles.helpCardTitle}>Стать партнёром Totus Club</h2>
                    <p className={styles.helpMuted}>Расскажите о себе — мы ответим на почту и обсудим условия.</p>
                    <ul className={styles.audience}>
                        {AUDIENCE.map((a) => (
                            <li key={a.title} className={styles.audienceItem}>
                                <span className={styles.partnerIcon}>
                                    <HelpIcon name={a.icon} />
                                </span>
                                <div>
                                    <h3 className={styles.partnerItemTitle}>{a.title}</h3>
                                    <p className={styles.partnerItemText}>{a.text}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                <PartnerForm />
            </section>
        </div>
    );
}
