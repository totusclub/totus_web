import React, { useMemo } from 'react';
import styles from './checkboxGroup.module.css';
import Checkbox from '@/components/UI/checkboxGroup/checkBox';
import { pluralizeRu } from '@/utils/formatRussianPlural';
import { NARROW_NBSP, formatFilterOptionName } from '@/utils/filterChips';
import { RUB_SUFFIX } from '@/utils/formatPrice';
import HotelIcon from '@/components/icons/totus/HotelIcon';
import type { TotusIconKey } from '@/components/icons/totus/registry.generated';

interface Option {
    id?: number | string;
    name?: string;
    selected?: boolean;
    disabled?: boolean;
    [key: string]: any;
}

interface CheckboxGroupProps {
    options: Option[];
    selected?: (number | string)[] | string;
    onChange: (key?: string, selected?: string) => void;
    name?: string;
    pk?: boolean;
    netPrice?: number;
    /** Иконка варианта (набор Totus) — например, тип питания или покрытие пляжа. */
    optionIcon?: (option: Option) => TotusIconKey | null | undefined;
}

function valuesEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    return String(a) === String(b);
}

export default function CheckboxGroup({
    options,
    selected,
    onChange,
    name,
    pk,
    netPrice,
    optionIcon,
}: CheckboxGroupProps) {
    const getOptionValue = (item: any) => {
        if (name === 'transitions_count') return item?.number;
        return (
            item?.id ??
            item?.luggage_type ??
            item?.flight_class ??
            item?.number ??
            item?.flight_type ??
            item?.interval
        );
    };

    const selectedValues = useMemo(() => {
        if (Array.isArray(selected)) return selected;
        if (typeof selected === 'string') {
            return selected
                .split(',')
                .map((part) => part.trim())
                .filter(Boolean);
        }
        return (options || [])
            .filter((item) => item?.selected)
            .map((item) => getOptionValue(item));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected, options, name]);

    const isSelected = (value: number | string) =>
        selectedValues.some((item) => valuesEqual(item, value));

    const handleToggle = (id: number | string) => {
        if (id === undefined || id === null || id === '') return;

        const next = isSelected(id)
            ? selectedValues.filter((item) => !valuesEqual(item, id))
            : [...selectedValues, id];

        onChange(name, next.join(','));
    };

    const renderName = (item: any) => {
        // Подписи опций фильтров отелей — единые с тегами над списком (utils/filterChips)
        if (
            name === 'filter_stars' ||
            name === 'filter_rating' ||
            name === 'filter_wifi' ||
            name === 'filter_beach_surface' ||
            name === 'filter_beach_type' ||
            name === 'filter_category' ||
            name === 'filter_confirmability' ||
            name === 'filter_line'
        ) {
            return formatFilterOptionName(name, item);
        }

        if (
            name === 'filter_regions' ||
            name === 'filter_meals' ||
            name === 'filter_hotel_type' ||
            name === 'filter_operators' ||
            name === 'forward_airlines' ||
            name === 'backward_airlines' ||
            name === 'arrival_airports' ||
            name === 'departure_airports' ||
            name === 'operators'
        ) {
            return item.name;
        }

        if (name === 'forward_departure_intervals' || name === 'backward_departure_intervals') {
            const intervalMap: Record<string, string> = {
                night: 'Ночь',
                evening: 'Вечер',
                morning: 'Утро',
                midday: 'День',
                afternoon: 'День',
            };
            return intervalMap[item.interval] || item.interval;
        }

        if (name === 'luggage_types') {
            if (item.luggage_type === 'all') return 'Все';
            if (item.luggage_type === 'hold') return 'С багажом';
            if (item.luggage_type === 'heavy') return 'С багажом от 20кг';
        }

        if (name === 'flight_classes') {
            if (item.flight_class === 'econom') return 'Эконом';
            if (item.flight_class === 'business') return 'Бизнес';
        }

        if (name === 'flight_types') {
            if (item.flight_type === 'regular') return 'Регулярный рейс';
            if (item.flight_type === 'charter') return 'Чартерный рейс';
        }

        if (name === 'transitions_count') {
            if (item.number === 0) return 'Без пересадки';
            return `${item.number} ${pluralizeRu(Number(item.number), ['пересадка', 'пересадки', 'пересадок'])}`;
        }

        return item.name;
    };

    return (
        <div className={styles.wrapperGroupCheckbox}>
            {(options || []).map((option) => {
                if (option.disabled) return null;

                const value = getOptionValue(option);
                if (value === undefined || value === null) return null;

                const checked = isSelected(value);

                return (
                    // Вся строка — один переключатель: клик по чекбоксу, иконке или подписи
                    // отмечает вариант, курсор — указатель (раньше реагировали только чекбокс и подпись).
                    <div
                        key={String(value)}
                        className={styles.checkboxItem}
                        role="checkbox"
                        aria-checked={checked}
                        tabIndex={0}
                        onClick={() => handleToggle(value)}
                        onKeyDown={(e) => {
                            if (e.key === ' ' || e.key === 'Enter') {
                                e.preventDefault();
                                handleToggle(value);
                            }
                        }}
                    >
                        <Checkbox
                            option={option}
                            value={value}
                            checked={checked}
                            handleToggle={handleToggle}
                        />
                        {optionIcon ? (
                            <HotelIcon name={optionIcon(option)} size={20} className={styles.optionIcon} />
                        ) : null}
                        <div>
                            <p>{renderName(option)}</p>
                            {!pk && (
                                <span>
                                    {' '}
                                    {option?.hotel_count} отелей от{' '}
                                    {option?.min_price
                                        ?.toString()
                                        ?.replace(/\B(?=(\d{3})+(?!\d))/g, NARROW_NBSP)}
                                    {RUB_SUFFIX}
                                </span>
                            )}
                            {pk && option?.suitable_flights != null && (
                                <span>
                                    {' '}
                                    {option.suitable_flights}{' '}
                                    {pluralizeRu(Number(option.suitable_flights), [
                                        'рейс',
                                        'рейса',
                                        'рейсов',
                                    ])}{' '}
                                    от{' '}
                                    {(netPrice + option?.min_fuel_charge)
                                        ?.toString()
                                        ?.replace(/\B(?=(\d{3})+(?!\d))/g, NARROW_NBSP)}
                                    {RUB_SUFFIX}
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
