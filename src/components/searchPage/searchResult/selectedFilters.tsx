import styles from '../searchPage.module.css';
import Tag from '@/components/UI/tag';
import { buildFilterChips, type FilterChip } from '@/utils/filterChips';
import { useMemo } from 'react';

interface SelectedFiltersProps {
    hotels: any;
    disabled?: boolean;
    onRemove: (chip: FilterChip) => void;
    onReset: () => void;
}

/**
 * Ряд тегов выбранных фильтров над списком отелей (Figma: List / Tours).
 * Оранжевый тег с «×» снимает один фильтр, «Очистить все» — сбрасывает всё.
 */
const SelectedFilters = ({ hotels, disabled, onRemove, onReset }: SelectedFiltersProps) => {
    const chips = useMemo(() => buildFilterChips(hotels), [hotels]);

    if (chips.length === 0) return null;

    return (
        <div className={`${styles.selectedFiltersList} ${disabled ? styles.selectedFiltersDisabled : ''}`}>
            {chips.map((chip) => (
                <Tag
                    key={`${chip.key}:${chip.value ?? ''}`}
                    title={chip.label}
                    active
                    onClick={() => {
                        if (!disabled) onRemove(chip);
                    }}
                />
            ))}
            <Tag
                title={'Очистить все'}
                active={false}
                icon={'trash'}
                onClick={() => {
                    if (!disabled) onReset();
                }}
            />
        </div>
    );
};

export default SelectedFilters;
