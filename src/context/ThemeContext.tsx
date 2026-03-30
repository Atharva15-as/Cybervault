import { createContext, useContext, useLayoutEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Apply theme to DOM immediately (prevents flash)
function applyTheme() {
    const root = window.document.documentElement;
    root.classList.remove('light');
    root.classList.add('dark');
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    // Use useLayoutEffect to apply theme before paint
    useLayoutEffect(() => {
        applyTheme();
        localStorage.setItem('theme', 'dark');
    }, []);

    const toggleTheme = () => {
        // No-op, we only support dark mode
    };

    const setTheme = (_newTheme: Theme) => {
        // No-op
    };

    return (
        <ThemeContext.Provider value={{ theme: 'dark', toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
