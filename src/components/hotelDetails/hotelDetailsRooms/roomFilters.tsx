import styles from '../hotelDetails.module.css';
import Icon from '@/components/icons/Icon';
import { useEffect, useRef, useState } from 'react';
import {
    getConfirmabilityLabel,
    HotelRoomFilters,
    RoomFilterOption,
    selectConfirmabilityFilter,
    toggleFreeCancelFilter,
    toggleMealFilter,
    toggleOperatorFilter,
} from '@/utils/roomFilters';
import { formatPriceRub } from '@/utils/formatPrice';
import HotelIcon from '@/components/icons/totus/HotelIcon';
import type { TotusIconKey } from '@/components/icons/totus/registry.generated';

type RoomFiltersProps = {
    filters: HotelRoomFilters | null;
    hasActiveFilters?: boolean;
    onChange: (
        filters: HotelRoomFilters | ((current: HotelRoomFilters) => HotelRoomFilters),
    ) => void;
    onClear?: () => void;
};

type FilterKey = 'meals' | 'free_cancel' | 'confirmability' | 'operators';

function getFreeCancelLabel(option: RoomFilterOption): string {
    return option.id === true ? 'Бесплатная отмена' : 'Любые условия отмены';
}

function getSummary(
    options: RoomFilterOption[],
    getLabel: (option: RoomFilterOption) => string,
    allLabel = 'Все',
): string {
    const selected = options.filter((option) => option.selected && !option.disabled);
    if (!selected.length) return allLabel;
    if (selected.length === 1) return getLabel(selected[0]);
    if (selected.length <= 3) {
        return selected.map(getLabel).join(', ');
    }
    return `${selected.length} выбрано`;
}

function getFreeCancelSummary(options: RoomFilterOption[]): string {
    const selected = options.filter((option) => option.selected && !option.disabled);
    if (selected.some((option) => option.id === true)) {
        return 'Бесплатная отмена';
    }
    return 'Все';
}

function formatOfferCount(count: number | undefined): string {
    if (count == null) return '';
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return `${count} предложение`;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
        return `${count} предложения`;
    }
    return `${count} предложений`;
}

function FilterOptionRow({
    option,
    label,
    selected,
    disabled,
    mode = 'checkbox',
    onToggle,
}: {
    option: RoomFilterOption;
    label: string;
    selected: boolean;
    disabled?: boolean;
    mode?: 'checkbox' | 'radio';
    onToggle: () => void;
}) {
    return (
        <button
            type="button"
            className={`${styles.HotelDetailsRoomFilterOption} ${selected ? styles.HotelDetailsRoomFilterOptionActive : ''} ${disabled ? styles.HotelDetailsRoomFilterOptionDisabled : ''}`}
            onClick={disabled ? undefined : onToggle}
            disabled={disabled}
            aria-disabled={disabled}
        >
            {mode === 'radio' ? (
                <span
                    className={`${styles.HotelDetailsRoomFilterRadio} ${selected ? styles.HotelDetailsRoomFilterRadioActive : ''}`}
                />
            ) : (
                <Icon name={selected ? 'checkBoxActive' : 'checkBox'} size={20} />
            )}
            <span className={styles.HotelDetailsRoomFilterOptionText}>
                <span>{label}</span>
                {option.count != null ? (
                    <span className={styles.HotelDetailsRoomFilterOptionMeta}>
                        {formatOfferCount(option.count)}
                        {option.min_price != null && option.count > 0
                            ? ` от ${formatPriceRub(option.min_price)}`
                            : ''}
                    </span>
                ) : null}
            </span>
        </button>
    );
}

function RoomFilterDropdown({
    title,
    icon,
    summary,
    isOpen,
    onToggle,
    onClose,
    children,
}: {
    title: string;
    /** Иконка группы (набор Totus, 16px). */
    icon?: TotusIconKey;
    summary: string;
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    children: React.ReactNode;
}) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    return (
        <div ref={ref} className={styles.HotelDetailsRoomFilterDropdown}>
            <button
                type="button"
                className={`${styles.HotelDetailsRoomFilterTrigger} ${isOpen ? styles.HotelDetailsRoomFilterTriggerOpen : ''}`}
                onClick={onToggle}
                aria-expanded={isOpen}
            >
                {icon ? <HotelIcon name={icon} size={16} className={styles.HotelDetailsRoomFilterTriggerIcon} /> : null}
                <span className={styles.HotelDetailsRoomFilterTriggerText}>
                    <span className={styles.HotelDetailsRoomFilterTriggerTitle}>{title}</span>
                    <span className={styles.HotelDetailsRoomFilterTriggerValue}>{summary}</span>
                </span>
                <Icon name={isOpen ? 'upArrow' : 'downArrow'} size={16} color="var(--textPrimary)" />
            </button>

            {isOpen ? (
                <div className={styles.HotelDetailsRoomFilterPanel}>
                    <div className={styles.HotelDetailsRoomFilterPanelOptions}>{children}</div>
                </div>
            ) : null}
        </div>
    );
}

const RoomFilters = ({ filters, hasActiveFilters = false, onChange, onClear }: RoomFiltersProps) => {
    const [openFilter, setOpenFilter] = useState<FilterKey | null>(null);

    if (!filters) return null;

    const meals = filters.meals ?? [];
    const freeCancel = filters.free_cancel ?? [];
    const confirmability = filters.confirmability ?? [];
    const operators = filters.operators ?? [];

    const hasMeals = meals.length > 0;
    const hasFreeCancel = freeCancel.length > 0;
    const hasConfirmability = confirmability.length > 0;
    const hasOperators = operators.length > 0;

    if (!hasMeals && !hasFreeCancel && !hasConfirmability && !hasOperators) {
        return null;
    }

    const toggleDropdown = (key: FilterKey) => {
        setOpenFilter((current) => (current === key ? null : key));
    };

    return (
        <div className={styles.HotelDetailsRoomFilters}>
            <div className={styles.HotelDetailsRoomFiltersRow}>
                {hasMeals ? (
                    <RoomFilterDropdown
                        title="Питание"
                        icon="meal-ai"
                        summary={getSummary(meals, (meal) => meal.name || String(meal.id))}
                        isOpen={openFilter === 'meals'}
                        onToggle={() => toggleDropdown('meals')}
                        onClose={() => setOpenFilter(null)}
                    >
                        {meals.map((meal) => (
                            <FilterOptionRow
                                key={String(meal.id)}
                                option={meal}
                                label={meal.name || String(meal.id)}
                                selected={Boolean(meal.selected)}
                                disabled={meal.disabled}
                                onToggle={() =>
                                    onChange((current) => toggleMealFilter(current, String(meal.id)))
                                }
                            />
                        ))}
                    </RoomFilterDropdown>
                ) : null}

                {hasFreeCancel ? (
                    <RoomFilterDropdown
                        title="Отмена"
                        icon="free-cancel"
                        summary={getFreeCancelSummary(freeCancel)}
                        isOpen={openFilter === 'free_cancel'}
                        onToggle={() => toggleDropdown('free_cancel')}
                        onClose={() => setOpenFilter(null)}
                    >
                        {freeCancel.map((item) => (
                            <FilterOptionRow
                                key={String(item.id)}
                                option={item}
                                label={getFreeCancelLabel(item)}
                                selected={Boolean(item.selected)}
                                disabled={item.disabled}
                                onToggle={() =>
                                    onChange((current) => toggleFreeCancelFilter(current, Boolean(item.id)))
                                }
                            />
                        ))}
                    </RoomFilterDropdown>
                ) : null}

                {hasConfirmability ? (
                    <RoomFilterDropdown
                        title="Подтверждение"
                        icon="instant"
                        summary={getSummary(confirmability, getConfirmabilityLabel)}
                        isOpen={openFilter === 'confirmability'}
                        onToggle={() => toggleDropdown('confirmability')}
                        onClose={() => setOpenFilter(null)}
                    >
                        {confirmability.map((item) => (
                            <FilterOptionRow
                                key={String(item.id)}
                                option={item}
                                label={getConfirmabilityLabel(item)}
                                selected={Boolean(item.selected)}
                                disabled={item.disabled}
                                mode="radio"
                                onToggle={() =>
                                    onChange((current) =>
                                        selectConfirmabilityFilter(current, Number(item.id)),
                                    )
                                }
                            />
                        ))}
                    </RoomFilterDropdown>
                ) : null}

                {hasOperators ? (
                    <RoomFilterDropdown
                        title="Туроператор"
                        icon="operator"
                        summary={getSummary(operators, (operator) => operator.name || String(operator.id))}
                        isOpen={openFilter === 'operators'}
                        onToggle={() => toggleDropdown('operators')}
                        onClose={() => setOpenFilter(null)}
                    >
                        {operators.map((operator) => (
                            <FilterOptionRow
                                key={String(operator.id)}
                                option={operator}
                                label={operator.name || String(operator.id)}
                                selected={Boolean(operator.selected)}
                                disabled={operator.disabled}
                                onToggle={() =>
                                    onChange((current) =>
                                        toggleOperatorFilter(current, Number(operator.id)),
                                    )
                                }
                            />
                        ))}
                    </RoomFilterDropdown>
                ) : null}
            </div>
            {hasActiveFilters && onClear ? (
                <button type="button" className={styles.HotelDetailsRoomFiltersClear} onClick={onClear}>
                    Сбросить фильтры
                </button>
            ) : null}
        </div>
    );
};

export default RoomFilters;
