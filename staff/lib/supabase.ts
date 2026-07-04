
// Polyfill for Supabase Storage
import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';


const ADMIN_SUPABASE_URL = process.env.EXPO_PUBLIC_ADMIN_SUPABASE_URL || '';
const ADMIN_SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_ADMIN_SUPABASE_ANON_KEY || '';

const STUDENT_SUPABASE_URL = process.env.EXPO_PUBLIC_STUDENT_SUPABASE_URL || '';
const STUDENT_SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_STUDENT_SUPABASE_ANON_KEY || '';

// Validation
if (!ADMIN_SUPABASE_URL || !ADMIN_SUPABASE_ANON_KEY) {
    console.warn('Missing ADMIN Supabase environment variables');
}
if (!STUDENT_SUPABASE_URL || !STUDENT_SUPABASE_ANON_KEY) {
    console.warn('Missing STUDENT Supabase environment variables');
}


const ExpoStorage = {
    getItem: (key: string) => {
        if (typeof window === 'undefined') return Promise.resolve(null);
        return AsyncStorage.getItem(key);
    },
    setItem: (key: string, value: string) => {
        if (typeof window === 'undefined') return Promise.resolve();
        return AsyncStorage.setItem(key, value);
    },
    removeItem: (key: string) => {
        if (typeof window === 'undefined') return Promise.resolve();
        return AsyncStorage.removeItem(key);
    },
};

export const adminSupabase = createClient(ADMIN_SUPABASE_URL, ADMIN_SUPABASE_ANON_KEY, {
    auth: {
        storage: ExpoStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

export const studentSupabase = createClient(STUDENT_SUPABASE_URL, STUDENT_SUPABASE_ANON_KEY, {
    auth: {
        storage: ExpoStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

// Tells Supabase Auth to refresh the session when the app resumes.
if (typeof window !== 'undefined') {
    AppState.addEventListener('change', (state) => {
        if (state === 'active') {
            adminSupabase.auth.startAutoRefresh();
            studentSupabase.auth.startAutoRefresh();
        } else {
            adminSupabase.auth.stopAutoRefresh();
            studentSupabase.auth.stopAutoRefresh();
        }
    });
}
