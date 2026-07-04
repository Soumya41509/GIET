import { adminSupabase } from '@/lib/supabase';
import { NotificationService } from '@/services/NotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

interface Staff {
    id: string;
    staff_id: string;
    name: string;
    role: string;
    department: string;
    hostel_assigned?: string;
    push_token?: string;
}

interface AuthContextType {
    staff: Staff | null;
    isInitialLoading: boolean;
    signIn: (staffId: string, password: string) => Promise<{ error?: string }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    staff: null,
    isInitialLoading: true,
    signIn: async () => ({}),
    signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [staff, setStaff] = useState<Staff | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    // Load session and register/update token
    useEffect(() => {
        const loadSession = async () => {
            try {
                const jsonValue = await AsyncStorage.getItem('@staff_session');
                if (jsonValue != null) {
                    const savedStaff = JSON.parse(jsonValue);

                    // VALIDATE STATUS ON STARTUP
                    const { data: currentStatus, error: statusError } = await adminSupabase
                        .from('staff')
                        .select('status')
                        .eq('id', savedStaff.id)
                        .maybeSingle();

                    if (statusError || !currentStatus || currentStatus.status !== 'active') {
                        console.log('Session invalid or account deactivated on startup');
                        await AsyncStorage.removeItem('@staff_session');
                        setStaff(null);
                        setIsInitialLoading(false);
                        return;
                    }

                    setStaff(savedStaff);

                    // Re-register push token on every fresh app load to ensure it's up to date
                    const token = await NotificationService.registerForPushNotificationsAsync();
                    if (token) {
                        await NotificationService.saveTokenToSupabase(savedStaff.id, token);
                        // Update local state if token changed
                        if (savedStaff.push_token !== token) {
                            const updatedStaff = { ...savedStaff, push_token: token };
                            setStaff(updatedStaff);
                            await AsyncStorage.setItem('@staff_session', JSON.stringify(updatedStaff));
                        }
                    }
                }
            } catch (e) {
                console.error('Failed to load session', e);
            } finally {
                setIsInitialLoading(false);
            }
        };

        loadSession();
    }, []);

    const signIn = async (staffId: string, password: string) => {
        try {
            if (!staffId || !password) {
                return { error: 'Please enter both Staff ID and Password' };
            }

            const { data: staffExists, error: checkError } = await adminSupabase
                .from('staff')
                .select('*')
                .eq('staff_id', staffId)
                .maybeSingle();

            if (checkError) {
                console.log("Login error:", checkError);
                return { error: 'Connection error. Please try again.' };
            }

            if (!staffExists) {
                return { error: 'Invalid Staff ID. Please check and try again.' };
            }

            if (staffExists.status !== 'active') {
                return { error: 'Your account has been deactivated. Please contact your administrator.' };
            }

            if (staffExists.password !== password) {
                return { error: 'Incorrect Password. Please try again.' };
            }

            // Get push token before finalizing login
            let pushToken: string | undefined;
            try {
                pushToken = await NotificationService.registerForPushNotificationsAsync();
                if (pushToken) {
                    await NotificationService.saveTokenToSupabase(staffExists.id, pushToken);
                }
            } catch (tokenErr) {
                console.warn('Failed to register push token during sign in:', tokenErr);
            }

            const staffData: Staff = {
                id: staffExists.id,
                staff_id: staffExists.staff_id,
                name: staffExists.name,
                role: staffExists.role,
                department: staffExists.department,
                hostel_assigned: staffExists.hostel_assigned,
                push_token: pushToken,
            };

            setStaff(staffData);
            await AsyncStorage.setItem('@staff_session', JSON.stringify(staffData));
            router.replace('/(tabs)');
            return {};

        } catch (e) {
            console.log("Unexpected login error:", e);
            return { error: 'An unexpected error occurred. Please try again.' };
        }
    };

    const signOut = async () => {
        try {
            await AsyncStorage.removeItem('@staff_session');
            setStaff(null);
            router.replace('/login');
        } catch (e) {
            console.error("Error signing out", e);
        }
    };

    // Periodically check account status (active/inactive)
    useEffect(() => {
        if (!staff) return;

        const checkAccountStatus = async () => {
            try {
                const { data, error } = await adminSupabase
                    .from('staff')
                    .select('status')
                    .eq('id', staff.id)
                    .maybeSingle();

                if (error) {
                    console.error('Error checking account status:', error);
                    return;
                }

                if (!data || data.status !== 'active') {
                    console.log('Account deactivated or not found. logging out...');
                    await signOut();
                }
            } catch (err) {
                console.error('Failed to run periodic status check:', err);
            }
        };

        // Initial check on mount
        checkAccountStatus();

        let interval: any;

        const startInterval = () => {
            if (interval) clearInterval(interval);
            interval = setInterval(checkAccountStatus, 30000);
        };

        const stopInterval = () => {
            if (interval) clearInterval(interval);
        };

        // Handle app state changes
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                checkAccountStatus(); // Check immediately when returning
                startInterval();
            } else {
                stopInterval();
            }
        });

        // Start if currently active
        if (AppState.currentState === 'active') {
            startInterval();
        }

        return () => {
            stopInterval();
            subscription.remove();
        };
    }, [staff]);

    return (
        <AuthContext.Provider value={{ staff, isInitialLoading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};
