import styles from './rangeInput.module.css';
import RangeStep from "@/components/UI/range";
import Input from "@/components/UI/input";

interface RangeInputProps {
    values: number[];
    setValues: (value: number[]) => void;
    onChangeComplete: (name:string,value: number[]) => void;
    title: string;
    symbol: string;
    step: number;
    min: number;
    max: number;
    name: string;
}

// Add a space as the thousands separator for readability, e.g. 1 886 300.
const formatNumber = (value: number) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return String(value ?? '');
    return Math.round(num)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

export default function RangeInput({ setValues, values, title ,symbol,step,min,max,name,onChangeComplete}: RangeInputProps) {

    return (
        <div className={styles.rangeInput}>
            <div className={styles.rangeInputHead}>
                <p>{title}</p>
                <div className={styles.rangeInputBadge}>
                    <p>{`От ${formatNumber(min)}${symbol} – До ${formatNumber(max)}${symbol}`}</p>
                </div>
            </div>
            <RangeStep step={step} min={min} max={max} values={values} onChangeComplete={(e)=>onChangeComplete(name,e)} setValues={(e)=>setValues(e)}/>
            <div className={styles.rangeInputGroup}>
                <Input
                    label={'Минимум'}
                    value={values[0]}
                    min={min}
                    max={max}
                    type={'number'}
                    onChange={(e)=>setValues([+e,values[1]])}
                />
                <div className={styles.rangeInputGroupLine}/>
                <Input
                    label={'Максимум'}
                    value={values[1]}
                    min={min}
                    max={max}
                    type={'number'}
                    onChange={(e)=>setValues([values[0],+e])}
                />
            </div>
        </div>
    );
}
