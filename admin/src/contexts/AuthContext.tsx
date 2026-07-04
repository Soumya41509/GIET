import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import type { User, Session } from '@supabase/supabase-js';
import AppLoader from '../components/ui/AppLoader';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    role: 'super_admin' | 'admin' | null;
    loading: boolean;
    login: (email: string, pass: string) => Promise<any>;
    register: (email: string, pass: string) => Promise<any>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [role, setRole] = useState<'super_admin' | 'admin' | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user?.email) {
                fetchRole(session.user.email);
            } else {
                setLoading(false);
            }
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user?.email) {
                setLoading(true);
                fetchRole(session.user.email);
            } else {
                setRole(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        let statusSubscription: any;
        let statusInterval: any;

        if (user?.email) {
            // Realtime listener
            statusSubscription = supabase
                .channel(`admin_status:${user.email}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'admins',
                        filter: `email=eq.${user.email}`,
                    },
                    async (payload: any) => {
                        if (payload.new.status === 'disabled') {
                            await logout();
                        }
                    }
                )
                .subscribe();

            // Polling fallback (every 10 seconds)
            // This ensures that even if realtime disconnects, the user is kicked out
            statusInterval = setInterval(async () => {
                const { data } = await supabase
                    .from('admins')
                    .select('status')
                    .eq('email', user.email)
                    .single();

                if (data && data.status === 'disabled') {
                    await logout();
                }
            }, 10000);
        }

        return () => {
            if (statusSubscription) statusSubscription.unsubscribe();
            if (statusInterval) clearInterval(statusInterval);
        };
    }, [user]);

    const fetchRole = async (email: string) => {
        try {
            const { data } = await supabase
                .from('admins')
                .select('role, status')
                .eq('email', email)
                .single();

            if (data) {
                if (data.status === 'disabled') {
                    console.warn("User account is disabled.");
                    await supabase.auth.signOut();
                    setRole(null);
                    setUser(null);
                    setSession(null);
                } else {
                    setRole(data.role as 'super_admin' | 'admin');
                }
            } else {
                setRole(null);
            }
        } catch (error) {
            console.error("Error fetching role:", error);
            setRole(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, pass: string) => {
        const cleanEmail = email.trim().toLowerCase();

        const { data: adminDoc, error: adminFetchError } = await supabase
            .from('admins')
            .select('status')
            .eq('email', cleanEmail)
            .maybeSingle();

        if (adminFetchError) {
            console.error("Supabase Database Error:", adminFetchError.message);
            throw new Error(`Database connection failed: ${adminFetchError.message}`);
        }

        if (!adminDoc) {
            throw new Error("No account found with this email.");
        }

        if (adminDoc.status === 'disabled') {
            throw new Error("Access Denied: Your account has been disabled.");
        }

        // 2. Perform Auth Login
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password: pass,
        });

        if (error) throw error;

        return data;
    };

    const register = async (email: string, pass: string) => {
        // 1. Check Whitelist in Supabase 'admins' table
        const { data: adminDoc } = await supabase
            .from('admins')
            .select('*')
            .eq('email', email)
            .single();

        if (!adminDoc) {
            throw new Error("Access Denied: Your email is not whitelisted by the Super Admin.");
        }

        if (adminDoc.status === 'disabled') {
            throw new Error("Access Denied: Your account has been disabled.");
        }

        // 2. Sign Up
        const { data, error } = await supabase.auth.signUp({
            email,
            password: pass,
        });

        if (error) throw error;
        return data;
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setRole(null);
        setUser(null);
        setSession(null);
    };

    return (
        <AuthContext.Provider value={{ user, session, role, loading, login, register, logout }}>
            {loading ? <AppLoader /> : children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
