import { useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import MenuProfile from '@/components/profile/menu';
import SwitchToggle from '@/components/UI/switch';
import useAuth from '@/hooks/useAuth';
import withAuth from '@/utils/withAuth';
import type { AppDispatch, RootState } from '@/store';
import type { NotificationCategory, NotificationPrefs, PushDevice } from '@/api/notificationsApi';
import { fetchSettings, saveSettings } from '@/store/slices/notificationsSlice';
import PushEnableCard from '@/components/notifications/PushEnableCard';
import styles from '@/components/notifications/notifications.module.css';
import TotusIcon from '@/components/icons/totus/TotusIcon';
import { iconChevronLeft } from '@/components/icons/totus/icons.generated';

/** Строки «ЧТО ПРИСЫЛАТЬ» (DESIGN.md). Обязательные — всегда включены и недоступны. */
const CATEGORY_ROWS: { key: NotificationCategory; title: string; subtitle: string; mandatory: boolean }[] = [
    { key: 'orders', title: 'Заказы и оплата', subtitle: 'Создание, оплата, отмена', mandatory: true },
    { key: 'documents', title: 'Документы и статусы тура', subtitle: 'Подтверждение, ваучеры, билеты', mandatory: true },
    { key: 'reminders', title: 'Напоминания о поездке', subtitle: 'За 3 дня и за сутки до вылета', mandatory: false },
    { key: 'support', title: 'Сообщения поддержки', subtitle: 'Ответы в чате и пропущенные звонки', mandatory: false },
    { key: 'promo', title: 'Акции и предложения', subtitle: 'Горящие туры и подборки, не чаще 2 раз в неделю', mandatory: false },
];

const PLATFORM_LABELS: Record<string, string> = {
    ios: 'iPhone',
    android: 'Android',
    web: 'Сайт totus.club',
    desktop: 'Компьютер',
};

function deviceLabel(device: PushDevice): string {
    const base = device.deviceName || PLATFORM_LABELS[device.platform] || device.platform;
    if (device.platform === 'web' && device.deviceName) return `Сайт totus.club · ${device.deviceName}`;
    return base;
}

/**
 * /profile/notifications/settings — «Настройки уведомлений».
 * Статус Web Push в браузере, категории (GET/PUT /api/notifications/settings), e-mail, устройства.
 */
const NotificationSettingsPage = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useAuth();
    const { settings, devices, settingsStatus, settingsError, savingSettings } = useSelector(
        (state: RootState) => state.notifications,
    );

    useEffect(() => {
        dispatch(fetchSettings());
    }, [dispatch]);

    const handlePref = (key: keyof NotificationPrefs, value: boolean) => {
        dispatch(saveSettings({ prefs: { [key]: value } })).then((action) => {
            if (saveSettings.rejected.match(action)) dispatch(fetchSettings());
        });
    };

    const handleEmail = (value: boolean) => {
        dispatch(saveSettings({ email: value })).then((action) => {
            if (saveSettings.rejected.match(action)) dispatch(fetchSettings());
        });
    };

    const mandatoryKeys = new Set<string>(
        settings?.categories?.filter((c) => c.mandatory).map((c) => c.key) ?? CATEGORY_ROWS.filter((r) => r.mandatory).map((r) => r.key),
    );

    return (
        <>
            <Head>
                <title>Настройки уведомлений — Totus Club</title>
                <meta name="robots" content="noindex" />
            </Head>
            <main className={'searchContainer'}>
                <div className={'content row'}>
                    <div className={styles.pageMenu}>
                        <MenuProfile />
                    </div>
                    <section className={styles.card} aria-label="Настройки уведомлений">
                        <div className={styles.cardHeader}>
                            <Link href="/profile/notifications" className={styles.backLink} aria-label="Назад к уведомлениям">
                                <TotusIcon icon={iconChevronLeft} size={22} />
                            </Link>
                            <div className={styles.cardHeaderText}>
                                <h1 className={styles.cardTitle}>Настройки уведомлений</h1>
                                <p className={styles.cardSubtitle}>Что и куда присылать</p>
                            </div>
                        </div>

                        <div className={styles.settingsBody}>
                            {/* Статус браузера: поддерживается / разрешение / подписка + «Включить» / «Отключить»;
                                iOS Safari вне PWA — подсказка «Добавьте сайт на экран «Домой»» */}
                            <PushEnableCard showWhenEnabled />

                            {settingsStatus === 'loading' && !settings ? (
                                <div className={styles.loading}>
                                    <span className={styles.spinner} />
                                </div>
                            ) : settingsStatus === 'error' && !settings ? (
                                <div className={styles.errorBox}>
                                    <p className={styles.errorTitle}>{settingsError || 'Уведомления временно недоступны'}</p>
                                    <button type="button" className={styles.retryBtn} onClick={() => dispatch(fetchSettings())}>
                                        Повторить
                                    </button>
                                </div>
                            ) : settings ? (
                                <>
                                    {settingsError ? <p className={styles.inlineError}>{settingsError}</p> : null}

                                    <div className={styles.section}>
                                        <p className={styles.sectionLabel}>Что присылать</p>
                                        <div className={styles.settingsCard}>
                                            {CATEGORY_ROWS.map((row) => {
                                                const mandatory = row.mandatory || mandatoryKeys.has(row.key);
                                                const isOn = mandatory ? true : Boolean(settings.prefs?.[row.key]);
                                                return (
                                                    <div key={row.key} className={styles.settingRow}>
                                                        <div className={styles.settingText}>
                                                            <p className={styles.settingTitle}>{row.title}</p>
                                                            <p className={styles.settingSub}>{row.subtitle}</p>
                                                        </div>
                                                        <div className={mandatory || savingSettings ? styles.settingDisabled : undefined} aria-disabled={mandatory}>
                                                            <SwitchToggle
                                                                isOn={isOn}
                                                                setIsOn={(value) => {
                                                                    if (!mandatory) handlePref(row.key, value);
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <p className={styles.settingNote}>
                                            Уведомления о заказах, оплате и документах отключить нельзя — они нужны, чтобы вы не пропустили
                                            важное по вашему туру. Акции приходят только с вашего согласия и не ночью (21:00–09:00 МСК).
                                        </p>
                                    </div>

                                    <div className={styles.section}>
                                        <p className={styles.sectionLabel}>Каналы</p>
                                        <div className={styles.settingsCard}>
                                            <div className={styles.settingRow}>
                                                <div className={styles.settingText}>
                                                    <p className={styles.settingTitle}>Электронная почта</p>
                                                    <p className={styles.settingSub}>
                                                        {user?.email ? `${user.email} · документы и чеки` : 'Документы и чеки'}
                                                    </p>
                                                </div>
                                                <div className={savingSettings ? styles.settingDisabled : undefined}>
                                                    <SwitchToggle isOn={Boolean(settings.email)} setIsOn={handleEmail} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {devices.length ? (
                                        <div className={styles.section}>
                                            <p className={styles.sectionLabel}>Ваши устройства</p>
                                            <div className={styles.settingsCard}>
                                                {devices.map((device) => (
                                                    <div key={device.id} className={styles.settingRow}>
                                                        <span className={`${styles.deviceDot} ${device.enabled ? '' : styles.deviceDotOff}`} aria-hidden />
                                                        <div className={styles.settingText}>
                                                            <p className={styles.settingTitle}>{deviceLabel(device)}</p>
                                                            <p className={styles.settingSub}>
                                                                {device.enabled ? 'push включён' : 'push отключён'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
                                </>
                            ) : null}
                        </div>
                    </section>
                </div>
            </main>
        </>
    );
};

export default withAuth(NotificationSettingsPage);
