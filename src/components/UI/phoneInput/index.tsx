'use client';
import { useState } from 'react';
import styles from './phoneInput.module.css';

const countries = [
    { name: 'Россия', code: '+7' },
    // { name: 'Армения', code: '+374' },
    // { name: 'Грузия', code: '+995' },
];

export default function PhoneInput({setError}) {
    const [selectedCountry, setSelectedCountry] = useState(countries[0]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [phone, setPhone] = useState('');


    const validatePhone = (value: string) => {
        const cleaned = value.replace(/\D/g, ''); // remove non-digit characters
        if (selectedCountry.code === '+7') {
            if (!/^7\d{10}$/.test(cleaned)) {
                setError(false);
            } else {
                setError(true);
            }
        } else {
            setError(true);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPhone(value);
        validatePhone(value);
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.section}>
                    <label className={styles.label}>Страна</label>
                    <button
                        className={styles.dropdownBtn}
                        onClick={() => setShowDropdown(!showDropdown)}
                    >
                        {selectedCountry.name} ({selectedCountry.code})
                        <span className={styles.dropdownArrow}>▾</span>
                    </button>
                    {showDropdown && (
                        <ul className={styles.dropdownList}>
                            {countries.map((country) => (
                                <li
                                    key={country.code}
                                    onClick={() => {
                                        setSelectedCountry(country);
                                        setShowDropdown(false);
                                        setPhone('');
                                        setError('');
                                    }}
                                    className={styles.dropdownItem}
                                >
                                    {country.name} ({country.code})
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className={styles.inputSection}>
                    <input
                        type="tel"
                        className={styles.inputField}
                        placeholder="Номер телефона"
                        value={phone}
                        onChange={handleChange}
                    />
                    {/*{error && <span className={styles.error}>{error}</span>}*/}
                </div>
            </div>
        </div>
    );
}
