import React, { useMemo } from 'react';
import styles from './checkboxGroup.module.css';
import Checkbox from '@/components/UI/checkboxGroup/checkBox';
import { pluralizeRu } from '@/utils/formatRussianPlural';

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
        if (name === 'filter_stars') {
            if (item.id === 5) return `${item.id} звёзд`;
            if (item.id === 1) return `${item.id} звезда`;
            return `${item.id} звезды`;
        }

        if (name === 'filter_rating') {
            return `от ${item.id}`;
        }

        if (name === 'filter_wifi') {
            const wifiMap: Record<string, string> = {
                FREE: 'Бесплатный Wi-Fi',
                PAID: 'Платный Wi-Fi',
                LOBBY_FREE: 'Бесплатный Wi-Fi в лобби',
                LOBBY_PAID: 'Платный Wi-Fi в лобби',
                LOBBY_UNKNOWN: 'Wi-Fi в лобби',
                NONE: 'Без Wi-Fi',
            };
            return wifiMap[String(item.id)] || item.name || String(item.id);
        }

        if (name === 'filter_beach_surface') {
            const beachSurfaceMap: Record<string, string> = {
                SAND: 'Песок',
                PEBBLE: 'Галька',
                'SAND+PEBBLE': 'Песок с галькой',
                SAND_PEBBLE: 'Песок с галькой',
                PLATFORM: 'Платформа',
                CONCRETE: 'Бетон',
                CORAL: 'Коралл',
                ROCKS: 'Скалы',
            };
            return beachSurfaceMap[String(item.id)] || item.name || String(item.id);
        }

        if (name === 'filter_beach_type') {
            const beachTypeMap: Record<string, string> = {
                DESIGNATED: 'Собственный пляж',
                PUBLIC: 'Общественный пляж',
            };
            return beachTypeMap[String(item.id)] || item.name || String(item.id);
        }

        if (name === 'filter_category') {
            const categoryMap: Record<string, string> = {
                FAMILY: 'Для семьи',
                COUPLES: 'Для пар',
                ACTIVE: 'Активный отдых',
            };
            return categoryMap[String(item.id)] || item.name || String(item.id);
        }

        if (name === 'filter_confirmability') {
            const confirmabilityMap: Record<string, string> = {
                '1': 'Мгновенное подтверждение',
                '2': 'Быстрое подтверждение',
                '3': 'Любое подтверждение',
            };
            return confirmabilityMap[String(item.id)] || item.name || String(item.id);
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

        if (name === 'filter_line') return `${item.id}-я линия`;

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
                    <div key={String(value)} className={styles.checkboxItem}>
                        <Checkbox
                            option={option}
                            value={value}
                            checked={checked}
                            handleToggle={handleToggle}
                        />
                        <div>
                            <p onClick={() => handleToggle(value)}>{renderName(option)}</p>
                            {!pk && (
                                <span>
                                    {' '}
                                    {option?.hotel_count} отелей от{' '}
                                    {option?.min_price
                                        ?.toString()
                                        ?.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F')}
                                    ₽
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
                                        ?.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F')}
                                    ₽
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
