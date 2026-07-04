import { Colors } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';

type ThemeType = 'light' | 'dark';
type ThemePreference = 'light' | 'dark' | 'auto';

interface ThemeContextType {
    theme: ThemeType;
    preference: ThemePreference;
    setPreference: (pref: ThemePreference) => Promise<void>;
    colors: typeof Colors.light;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@giet_preference_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const deviceColorScheme = useDeviceColorScheme();
    const [preference, setPreferenceState] = useState<ThemePreference>('auto');
    const [activeTheme, setActiveTheme] = useState<ThemeType>(deviceColorScheme || 'light');

    // Load persisted preference
    useEffect(() => {
        async function loadPreference() {
            const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
            if (stored) {
                setPreferenceState(stored as ThemePreference);
            }
        }
        loadPreference();
    }, []);

    // Update active theme based on preference and device settings
    useEffect(() => {
        const updateTheme = () => {
            if (preference === 'auto') {
                setActiveTheme(deviceColorScheme || 'light');
            } else {
                setActiveTheme(preference);
            }
        };

        updateTheme();
    }, [preference, deviceColorScheme]);

    const setPreference = async (pref: ThemePreference) => {
        setPreferenceState(pref);
        await AsyncStorage.setItem(THEME_STORAGE_KEY, pref);
    };

    const value = {
        theme: activeTheme,
        preference,
        setPreference,
        colors: Colors[activeTheme],
    };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
