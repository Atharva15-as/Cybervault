import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signInWithGoogle: () => Promise<{ error: AuthError | null }>;
    signInWithGitHub: () => Promise<{ error: AuthError | null }>;
    signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signUp: (email: string, password: string, name?: string) => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const IS_DEMO_MODE = false; // Disable Demo Mode to use real Supabase auth

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (IS_DEMO_MODE) {
            // Check for mock session in keys
            const storedSession = localStorage.getItem('cybervault_demo_session');
            if (storedSession) {
                const sessionData = JSON.parse(storedSession);
                setUser(sessionData.user);
                setSession(sessionData);
            }
            setLoading(false);
            return;
        }

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);

            // Set session date if just logged in
            if (session) {
                const storedDate = localStorage.getItem('cybervault_session_date');
                if (!storedDate) {
                    localStorage.setItem('cybervault_session_date', new Date().toDateString());
                }
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);

                if (session) {
                    const storedDate = localStorage.getItem('cybervault_session_date');
                    const today = new Date().toDateString();

                    // If no date stored, store today
                    if (!storedDate) {
                        localStorage.setItem('cybervault_session_date', today);
                    }
                    // If date stored is different from today, logout (New Day Detection)
                    else if (storedDate !== today) {
                        console.log('New day detected, logging out...');
                        signOut(); // Call local signOut wrapper
                    }
                } else {
                    // Clear date on logout
                    localStorage.removeItem('cybervault_session_date');
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    // Daily Session Check Interval
    useEffect(() => {
        if (!user) return;

        const checkDailySession = () => {
            const storedDate = localStorage.getItem('cybervault_session_date');
            const today = new Date().toDateString();

            if (storedDate && storedDate !== today) {
                console.log('Session expired (New Day), logging out...');
                signOut();
            }
        };

        // Check every minute
        const interval = setInterval(checkDailySession, 60000); // 1 minute

        // Initial check
        checkDailySession();

        return () => clearInterval(interval);
    }, [user]);

    const mockLogin = () => {
        const mockUser: any = {
            id: 'demo-user-123',
            aud: 'authenticated',
            role: 'authenticated',
            email: 'demo@cybervault.com',
            email_confirmed_at: new Date().toISOString(),
            user_metadata: {
                full_name: 'Demo User',
            },
            app_metadata: {
                provider: 'google'
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const mockSession: any = {
            access_token: 'mock-token',
            token_type: 'bearer',
            expires_in: 3600,
            refresh_token: 'mock-refresh',
            user: mockUser,
            expires_at: Date.now() + 3600000,
        };

        setUser(mockUser);
        setSession(mockSession);
        localStorage.setItem('cybervault_demo_session', JSON.stringify(mockSession));
        return { error: null };
    };

    const signInWithGoogle = async () => {
        if (IS_DEMO_MODE) return mockLogin();

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/dashboard`,
            },
        });
        return { error };
    };

    const signInWithGitHub = async () => {
        if (IS_DEMO_MODE) return mockLogin();

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: `${window.location.origin}/dashboard`,
            },
        });
        return { error };
    };

    const signIn = async (email: string, password: string) => {
        if (IS_DEMO_MODE) return mockLogin();

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        return { error };
    };

    const signUp = async (email: string, password: string, name?: string) => {
        if (IS_DEMO_MODE) return mockLogin();

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                },
            },
        });
        return { error };
    };

    const signOut = async () => {
        if (IS_DEMO_MODE) {
            setUser(null);
            setSession(null);
            localStorage.removeItem('cybervault_demo_session');
            localStorage.removeItem('cybervault_session_date');
            return;
        }
        localStorage.removeItem('cybervault_session_date');
        await supabase.auth.signOut();
    };

    const resetPassword = async (email: string) => {
        if (IS_DEMO_MODE) return { error: null };

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        return { error };
    };

    return (
        <AuthContext.Provider value={{
            user,
            session,
            loading,
            signInWithGoogle,
            signInWithGitHub,
            signIn,
            signUp,
            signOut,
            resetPassword,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
