import { useEffect, useState } from 'react';

const ThemeToggle = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
        const current = saved || 'light';
        setTheme(current);
        document.documentElement.setAttribute('data-theme', current);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    };

    return (
        <button onClick={toggleTheme}>
            Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
        </button>
    );
};

export default ThemeToggle;
