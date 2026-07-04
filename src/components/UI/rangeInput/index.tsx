import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import styles from './rangeInput.module.css';
import RangeStep from "@/components/UI/range";
import Input from "@/components/UI/input";

interface RangeInputProps {
    values: number[];
    setValues: (value: number[]) => void;
    onChangeComplete: (name: string, value: number[]) => void;
    title: string;
    symbol: string;
    step: number;
    min: number;
    max: number;
    name: string;
}

const formatNumber = (value: number) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return '';
    return Math.round(num)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const sanitizeDraft = (raw: string) => raw.replace(/[^\d]/g, '');

const parseDraftValue = (raw: string): number | null => {
    const cleaned = sanitizeDraft(raw).trim();
    if (!cleaned) return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
};

const clampValue = (value: number, rangeMin: number, rangeMax: number) =>
    Math.min(Math.max(value, rangeMin), rangeMax);

const normalizeRange = (values: number[], rangeMin: number, rangeMax: number): [number, number] => {
    const left = clampValue(Number(values[0] ?? rangeMin), rangeMin, rangeMax);
    const right = clampValue(Number(values[1] ?? rangeMax), rangeMin, rangeMax);
    return [Math.min(left, right), Math.max(left, right)];
};

const snapToStep = (value: number, step: number, rangeMin: number, rangeMax: number) => {
    const clamped = clampValue(value, rangeMin, rangeMax);
    if (step <= 1) return Math.round(clamped);
    const snapped = rangeMin + Math.round((clamped - rangeMin) / step) * step;
    return clampValue(snapped, rangeMin, rangeMax);
};

export default function RangeInput({
    setValues,
    values,
    title,
    symbol,
    step,
    min,
    max,
    name,
    onChangeComplete,
}: RangeInputProps) {
    const range = useMemo(() => normalizeRange(values, min, max), [values, min, max]);
    const [minDraft, setMinDraft] = useState(String(range[0]));
    const [maxDraft, setMaxDraft] = useState(String(range[1]));
    const [minFocused, setMinFocused] = useState(false);
    const [maxFocused, setMaxFocused] = useState(false);

    useEffect(() => {
        if (!minFocused) {
            setMinDraft(String(range[0]));
        }
    }, [range[0], minFocused]);

    useEffect(() => {
        if (!maxFocused) {
            setMaxDraft(String(range[1]));
        }
    }, [range[1], maxFocused]);

    const applyRange = (nextMin: number, nextMax: number, applyFilter: boolean) => {
        const snappedMin = snapToStep(nextMin, step, min, max);
        const snappedMax = snapToStep(nextMax, step, min, max);
        const [left, right] = normalizeRange([snappedMin, snappedMax], min, max);
        const nextRange: [number, number] = [left, right];

        setMinDraft(String(left));
        setMaxDraft(String(right));
        setValues(nextRange);

        if (applyFilter && (left !== range[0] || right !== range[1])) {
            onChangeComplete(name, nextRange);
        }
    };

    const handleSliderChange = (nextValues: number[]) => {
        const [left, right] = normalizeRange(nextValues, min, max);
        setValues([left, right]);
        if (!minFocused) setMinDraft(String(left));
        if (!maxFocused) setMaxDraft(String(right));
    };

    const handleSliderComplete = (nextValues: number[]) => {
        const [left, right] = normalizeRange(nextValues, min, max);
        const snappedMin = snapToStep(left, step, min, max);
        const snappedMax = snapToStep(right, step, min, max);
        const nextRange = normalizeRange([snappedMin, snappedMax], min, max);

        setMinDraft(String(nextRange[0]));
        setMaxDraft(String(nextRange[1]));
        setValues(nextRange);
        setMinFocused(false);
        setMaxFocused(false);
        onChangeComplete(name, nextRange);
    };

    const handleMinBlur = () => {
        const parsedMin = parseDraftValue(minDraft) ?? range[0];
        let nextMin = clampValue(parsedMin, min, max);
        let nextMax = range[1];

        if (nextMin > nextMax) {
            nextMax = nextMin;
        }

        applyRange(nextMin, nextMax, true);
        setMinFocused(false);
    };

    const handleMaxBlur = () => {
        const parsedMax = parseDraftValue(maxDraft) ?? range[1];
        let nextMax = clampValue(parsedMax, min, max);
        let nextMin = range[0];

        if (nextMax < nextMin) {
            nextMin = nextMax;
        }

        applyRange(nextMin, nextMax, true);
        setMaxFocused(false);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.currentTarget.blur();
        }
    };

    const sliderDisabled = min >= max;

    return (
        <div className={styles.rangeInput}>
            <div className={styles.rangeInputHead}>
                <p>{title}</p>
                <div className={styles.rangeInputBadge}>
                    <p>{`От ${formatNumber(min)}${symbol} – До ${formatNumber(max)}${symbol}`}</p>
                </div>
            </div>
            {!sliderDisabled && (
                <RangeStep
                    step={step}
                    min={min}
                    max={max}
                    values={range}
                    setValues={handleSliderChange}
                    onChangeComplete={handleSliderComplete}
                />
            )}
            <div className={styles.rangeInputGroup}>
                <Input
                    label={'Минимум'}
                    value={minFocused ? minDraft : formatNumber(range[0])}
                    type={'text'}
                    inputMode="numeric"
                    onFocus={() => {
                        setMinDraft(String(range[0]));
                        setMinFocused(true);
                    }}
                    onBlur={handleMinBlur}
                    onKeyDown={handleKeyDown}
                    onChange={(value) => setMinDraft(sanitizeDraft(String(value)))}
                />
                <div className={styles.rangeInputGroupLine} />
                <Input
                    label={'Максимум'}
                    value={maxFocused ? maxDraft : formatNumber(range[1])}
                    type={'text'}
                    inputMode="numeric"
                    onFocus={() => {
                        setMaxDraft(String(range[1]));
                        setMaxFocused(true);
                    }}
                    onBlur={handleMaxBlur}
                    onKeyDown={handleKeyDown}
                    onChange={(value) => setMaxDraft(sanitizeDraft(String(value)))}
                />
            </div>
        </div>
    );
}
