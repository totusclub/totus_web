import styles from '../searchPage.module.css';

/*
 * Загрузка выдачи на телефоне и планшете (до 1024 px; на компьютере — прежние Progress и HotelCard lazy).
 * Повторяет настоящую страницу, чтобы после загрузки ничего не прыгало:
 * - MobileSearchLoading — на месте блока тегов и сортировки, той же высоты (120 px);
 * - MobileHotelCardSkeleton — карточка отеля строка в строку: фото 200, звёзды, название,
 *   отзывы с оценкой, две строки тегов, цена, дата, кнопка «Выбрать» 48 px.
 * Цвета — из темы (--bgSecondary / --bgTertiary), работает в светлой и тёмной.
 */

const Bar = ({ width, height, radius }: { width: string; height: number; radius?: number }) => (
    <div className={styles.skeleton} style={{ width, height, borderRadius: radius }} />
);

export const MobileSearchLoading = ({ title }: { title: string }) => (
    <div className={styles.mobileLoading} role="status" aria-live="polite">
        <p className={styles.mobileLoadingTitle}>
            <span className={styles.mobileLoadingSpin} aria-hidden />
            {title}
        </p>
        <div className={styles.mobileLoadingBar} aria-hidden>
            <span />
        </div>
        <div className={styles.mobileLoadingChips} aria-hidden>
            <Bar width="96px" height={28} radius={14} />
            <Bar width="96px" height={28} radius={14} />
            <Bar width="96px" height={28} radius={14} />
        </div>
    </div>
);

export const MobileHotelCardSkeleton = () => (
    <div className={styles.skeletonCard} aria-hidden>
        <Bar width="100%" height={200} />
        <div className={styles.skeletonCardInfo}>
            <div className={styles.skeletonRow} style={{ gap: 2 }}>
                {[0, 1, 2, 3, 4].map((i) => (
                    <Bar key={i} width="16px" height={16} radius={4} />
                ))}
            </div>
            <Bar width="72%" height={24} />
            <div className={styles.skeletonRow}>
                <Bar width="96px" height={16} />
                <Bar width="28px" height={16} radius={4} />
            </div>
            <div className={styles.skeletonCardInfo} style={{ gap: 4 }}>
                <div className={styles.skeletonRow} style={{ flexWrap: 'nowrap' }}>
                    <Bar width="34%" height={24} radius={12} />
                    <Bar width="30%" height={24} radius={12} />
                    <Bar width="26%" height={24} radius={12} />
                </div>
                <div className={styles.skeletonRow} style={{ flexWrap: 'nowrap' }}>
                    <Bar width="22%" height={24} radius={12} />
                    <Bar width="38%" height={24} radius={12} />
                </div>
            </div>
            <Bar width="132px" height={24} />
            <Bar width="180px" height={16} />
            <div style={{ marginTop: 4 }}>
                <Bar width="100%" height={48} radius={24} />
            </div>
        </div>
    </div>
);
