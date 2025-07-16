'use client';
import { useState } from 'react';
import styles from './phoneInput.module.css';

const countries = [
    { name: 'Россия', code: '+7' },
    { name: 'Армения', code: '+374' },
    { name: 'Грузия', code: '+995' },
];

export default function PhoneInput() {
    const [selectedCountry, setSelectedCountry] = useState(countries[0]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [phone, setPhone] = useState('');

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
                    {/*<label className={styles.label}>Номер телефона</label>*/}
                    <input
                        type="tel"
                        className={styles.inputField}
                        placeholder="Номер телефона"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
}
