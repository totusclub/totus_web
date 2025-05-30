import styles from './rangeInput.module.css';
import RangeStep from "@/components/UI/range";
import Input from "@/components/UI/input";

interface RangeInputProps {
    values: number[];
    setValues: (value: number[]) => void;
    title: string;
    symbol: string;
    step: number;
    min: number;
    max: number;
}

export default function RangeInput({ setValues, values, title ,symbol,step,min,max}: RangeInputProps) {

    return (
        <div className={styles.rangeInput}>
            <div className={styles.rangeInputHead}>
                <p>{title}</p>
                <div className={styles.rangeInputBadge}>
                    <p>{`От ${min}${symbol} – До ${max}${symbol}`}</p>
                </div>
            </div>
            <RangeStep step={step} min={min} max={max} values={values} setValues={setValues}/>
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
