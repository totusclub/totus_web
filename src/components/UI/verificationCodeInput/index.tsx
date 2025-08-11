import { useState, useRef } from 'react';
import styles from './verificationCodeInput.module.css'

export default function VerificationCodeInput({ onComplete,valid }) {
    const [code, setCode] = useState(['', '', '', '']);
    const inputsRef = useRef([]);

    // When input changes
    const handleChange = (e, idx) => {
        const val = e.target.value;
        if (!/^\d?$/.test(val)) return; // only allow one digit 0-9

        const newCode = [...code];
        newCode[idx] = val;
        setCode(newCode);

        // Move focus to next input if digit entered
        if (val && idx < 3) {
            inputsRef.current[idx + 1].focus();
        }

        // If all digits filled, call onComplete
        if (newCode.every((d) => d !== '')) {
            onComplete && onComplete(newCode.join(''));
        }
    };

    // Handle backspace: move focus back if empty
    const handleKeyDown = (e, idx) => {
        if (e.key === 'Backspace' && code[idx] === '' && idx > 0) {
            inputsRef.current[idx - 1].focus();
        }
    };

    return (
        <div className={styles.inputsCodeWrap}>
            {code.map((digit, idx) => (
                <input
                    key={idx}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(e, idx)}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    ref={(el) => (inputsRef.current[idx] = el)}
                    className={styles.inputsCode}
                    style={{borderColor:valid?'red':'grey'}}
                />
            ))}
        </div>
    );
}
