import Icon from '@/components/icons/Icon';
import { useSearchTypeSwitch } from '@/hooks/useSearchTypeSwitch';
import type { SearchTypeValue } from '@/utils/searchQuery';
import styles from './searchTypeSwitch.module.css';

/** Те же названия и подсказки, что у вкладок на главной (searchForm.tsx, SEARCH_TYPE_TABS). */
const TABS: { id: SearchTypeValue; label: string; hint: string; icon: 'plane' | 'hotel' }[] = [
    { id: 'package', label: 'Тур', hint: 'С перелётом', icon: 'plane' },
    { id: 'hotel', label: 'Отель', hint: 'Без перелёта', icon: 'hotel' },
];

/**
 * Переключатель «Тур / Отель» на странице выдачи — вариант A макета (утверждён 02.11.2026):
 * header — в шапке рядом с формой (компьютер, шире 1024 px);
 * mobile — строкой под шапкой над выдачей (телефон и планшет, до 1024 px).
 */
const SearchTypeSwitch = ({ variant }: { variant: 'header' | 'mobile' }) => {
    const { searchType, switchSearchType } = useSearchTypeSwitch();
    const isHeader = variant === 'header';

    return (
        <div
            className={isHeader ? styles.headerTabs : styles.mobileTabs}
            role="tablist"
            aria-label="Тип поиска"
            data-search-type-switch={variant}
        >
            {TABS.map((tab) => {
                const active = searchType === tab.id;
                return (
                    <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        className={`${styles.tab} ${active ? styles.tabActive : ''}`}
                        onClick={() => switchSearchType(tab.id)}
                    >
                        <Icon
                            name={tab.icon}
                            size={isHeader ? 20 : 18}
                            color={active ? 'var(--core_Orange)' : 'var(--textTertiary)'}
                        />
                        {isHeader ? (
                            <span className={styles.tabText}>
                                <span className={styles.tabLabel}>{tab.label}</span>
                                <span className={styles.tabHint}>{tab.hint}</span>
                            </span>
                        ) : (
                            <span className={styles.tabLabel}>{tab.label}</span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export default SearchTypeSwitch;
