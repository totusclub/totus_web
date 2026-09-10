import { useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import MenuProfile from '@/components/profile/menu';
import withAuth from '@/utils/withAuth';
import type { AppDispatch, RootState } from '@/store';
import type { NotificationItem as NotificationItemModel } from '@/api/notificationsApi';
import {
    fetchMoreNotifications,
    fetchNotifications,
    markNotificationsRead,
    markReadLocal,
    removeNotification,
    setFilter,
    type NotificationsFilter,
} from '@/store/slices/notificationsSlice';
import NotificationFilters from '@/components/notifications/NotificationFilters';
import NotificationItem from '@/components/notifications/NotificationItem';
import NotificationsEmpty from '@/components/notifications/NotificationsEmpty';
import { formatUnreadLabel, groupNotifications } from '@/components/notifications/dates';
import { useOpenNotification } from '@/components/notifications/useOpenNotification';
import styles from '@/components/notifications/notifications.module.css';

/**
 * /profile/notifications — «Уведомления».
 * Desktop (>1024): меню ЛК слева + карточка (как /profile/support-chat). Mobile: карточка на весь экран.
 */
const NotificationsPage = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { items, hasMore, unread, status, loadingMore, error, filter } = useSelector(
        (state: RootState) => state.notifications,
    );
    const openNotification = useOpenNotification();

    useEffect(() => {
        if (status === 'idle') dispatch(fetchNotifications({ filter }));
    }, [status, filter, dispatch]);

    const groups = useMemo(() => groupNotifications(items), [items]);

    const handleFilter = (value: NotificationsFilter) => {
        dispatch(setFilter(value));
    };

    const handleReadAll = () => {
        dispatch(markReadLocal('all'));
        dispatch(markNotificationsRead('all'));
    };

    const handleOpen = (item: NotificationItemModel) => {
        openNotification(item.id, item.data);
    };

    const handleDelete = (item: NotificationItemModel) => {
        dispatch(removeNotification(item.id));
    };

    const subtitle = unread > 0 ? formatUnreadLabel(unread) : 'Заказы, оплата, напоминания и акции';

    return (
        <>
            <Head>
                <title>Уведомления — Totus Club</title>
                <meta name="robots" content="noindex" />
            </Head>
            <main className={'searchContainer'}>
                <div className={'content row'}>
                    <div className={styles.pageMenu}>
                        <MenuProfile />
                    </div>
                    <section className={styles.card} aria-label="Уведомления">
                        <div className={styles.cardHeader}>
                            <div className={styles.cardHeaderText}>
                                <h1 className={styles.cardTitle}>Уведомления</h1>
                                <p className={styles.cardSubtitle}>{subtitle}</p>
                            </div>
                            <div className={styles.headerActions}>
                                <button type="button" className={styles.readAllBtn} onClick={handleReadAll} disabled={unread === 0}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                        <path d="M3 13l4 4L13 9" />
                                        <path d="M11 17l2 2 8-8" />
                                    </svg>
                                    Прочитать все
                                </button>
                                <Link href="/profile/notifications/settings" className={styles.iconBtn} aria-label="Настройки уведомлений" title="Настройки уведомлений">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                        <circle cx="12" cy="12" r="3" />
                                        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
                                    </svg>
                                </Link>
                            </div>
                        </div>

                        <NotificationFilters value={filter} onChange={handleFilter} />

                        {status === 'loading' && !items.length ? (
                            <div className={styles.loading}>
                                <span className={styles.spinner} />
                            </div>
                        ) : status === 'error' && !items.length ? (
                            <div className={styles.errorBox}>
                                <p className={styles.errorTitle}>{error || 'Уведомления временно недоступны'}</p>
                                <button type="button" className={styles.retryBtn} onClick={() => dispatch(fetchNotifications({ filter }))}>
                                    Повторить
                                </button>
                            </div>
                        ) : !items.length ? (
                            <NotificationsEmpty filtered={filter !== 'all'} />
                        ) : (
                            <div className={styles.list}>
                                {error ? <p className={styles.inlineError}>{error}</p> : null}
                                {groups.map((group) => (
                                    <div key={group.key} className={styles.group}>
                                        <p className={styles.groupLabel}>{group.label}</p>
                                        {group.items.map((item) => (
                                            <NotificationItem key={item.id} item={item} onOpen={handleOpen} onDelete={handleDelete} />
                                        ))}
                                    </div>
                                ))}
                                {hasMore ? (
                                    <div className={styles.loadMoreRow}>
                                        <button
                                            type="button"
                                            className={styles.loadMoreBtn}
                                            onClick={() => dispatch(fetchMoreNotifications())}
                                            disabled={loadingMore}
                                        >
                                            {loadingMore ? 'Загрузка…' : 'Показать ещё'}
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </>
    );
};

export default withAuth(NotificationsPage);
