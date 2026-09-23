import { useState, useEffect, useCallback } from 'react';

const THEME_STORAGE_KEY = 'pd_theme';

export function usePDTheme() {
    const [isDark, setIsDark] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        const saved = localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem('theme');
        if (saved) return saved === 'dark';
        // PDUI v2: lần đầu vào mặc định Sáng.
        return false;
    });

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem(THEME_STORAGE_KEY, 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem(THEME_STORAGE_KEY, 'light');
        }
    }, [isDark]);

    const toggleTheme = useCallback(() => {
        setIsDark(prev => !prev);
    }, []);

    return { isDark, toggleTheme };
}
