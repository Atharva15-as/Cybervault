import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signInWithGoogle: (rememberMe?: boolean) => Promise<{ error: AuthError | null }>;
    signInWithGitHub: (rememberMe?: boolean) => Promise<{ error: AuthError | null }>;
    signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: AuthError | null }>;
    signUp: (email: string, password: string, name?: string) => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_START_KEY = 'cybervault_session_started_at';
const SESSION_DURATION_KEY = 'cybervault_session_max_age_ms';
const SESSION_PENDING_DURATION_KEY = 'cybervault_session_pending_max_age_ms';
const SESSION_DEFAULT_MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12 hours
const SESSION_REMEMBER_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    const setSessionStartIfMissing = () => {
        const existing = localStorage.getItem(SESSION_START_KEY);
        if (!existing) {
            localStorage.setItem(SESSION_START_KEY, Date.now().toString());
        }
    };

    const clearSessionStart = () => {
        localStorage.removeItem(SESSION_START_KEY);
    };

    const setSessionDurationPreference = (rememberMe: boolean) => {
        const duration = rememberMe ? SESSION_REMEMBER_MAX_AGE_MS : SESSION_DEFAULT_MAX_AGE_MS;
        localStorage.setItem(SESSION_DURATION_KEY, duration.toString());
        localStorage.setItem(SESSION_PENDING_DURATION_KEY, duration.toString());
    };

    const getSessionDurationMs = () => {
        const raw = localStorage.getItem(SESSION_DURATION_KEY);
        const parsed = Number(raw);
        if (!Number.isFinite(parsed) || parsed <= 0) {
            return SESSION_DEFAULT_MAX_AGE_MS;
        }
        return parsed;
    };

    const applyPendingSessionDuration = () => {
        const pendingRaw = localStorage.getItem(SESSION_PENDING_DURATION_KEY);
        if (!pendingRaw) return;
        localStorage.setItem(SESSION_DURATION_KEY, pendingRaw);
        localStorage.removeItem(SESSION_PENDING_DURATION_KEY);
    };

    const clearSessionDuration = () => {
        localStorage.removeItem(SESSION_DURATION_KEY);
        localStorage.removeItem(SESSION_PENDING_DURATION_KEY);
    };

    const isSessionExpired = () => {
        const startedAtRaw = localStorage.getItem(SESSION_START_KEY);
        if (!startedAtRaw) return false;
        const startedAt = Number(startedAtRaw);
        if (!Number.isFinite(startedAt)) return false;
        return Date.now() - startedAt >= getSessionDurationMs();
    };

    const forceSignOut = async () => {
        clearSessionStart();
        await supabase.auth.signOut();
    };

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);

            if (session) {
                if (!localStorage.getItem(SESSION_DURATION_KEY)) {
                    localStorage.setItem(SESSION_DURATION_KEY, SESSION_DEFAULT_MAX_AGE_MS.toString());
                }
                setSessionStartIfMissing();

                if (isSessionExpired()) {
                    forceSignOut();
                }
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);

                if (session) {
                    if (event === 'SIGNED_IN') {
                        applyPendingSessionDuration();
                        if (!localStorage.getItem(SESSION_DURATION_KEY)) {
                            localStorage.setItem(SESSION_DURATION_KEY, SESSION_DEFAULT_MAX_AGE_MS.toString());
                        }
                        localStorage.setItem(SESSION_START_KEY, Date.now().toString());
                    }

                    setSessionStartIfMissing();

                    if (isSessionExpired()) {
                        forceSignOut();
                    }
                } else {
                    clearSessionStart();
                    clearSessionDuration();
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    // Session duration enforcement (12 hours max)
    useEffect(() => {
        if (!user) return;

        const checkSessionExpiry = () => {
            if (isSessionExpired()) {
                forceSignOut();
            }
        };

        // Check every minute
        const interval = setInterval(checkSessionExpiry, 60000);

        // Initial check
        checkSessionExpiry();

        return () => clearInterval(interval);
    }, [user]);

    const handleOAuthSignIn = async (provider: 'google' | 'github') => {
        // Detect if we are running inside an iframe (like a preview environment)
        const isIframe = window !== window.top;

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/dashboard`,
                skipBrowserRedirect: isIframe, // Skip auto-redirect if in an iframe
            },
        });
        
        // If in an iframe, manually open the OAuth URL in a new tab/popup
        if (isIframe && data?.url) {
            window.open(data.url, '_blank', 'noopener,noreferrer');
        }

        return { error };
    };

    const signInWithGoogle = async (rememberMe = false) => {
        setSessionDurationPreference(rememberMe);
        return handleOAuthSignIn('google');
    };

    const signInWithGitHub = async (rememberMe = false) => {
        setSessionDurationPreference(rememberMe);
        return handleOAuthSignIn('github');
    };

    const signIn = async (email: string, password: string, rememberMe = false) => {
        setSessionDurationPreference(rememberMe);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        return { error };
    };

    const signUp = async (email: string, password: string, name?: string) => {
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
        clearSessionStart();
        clearSessionDuration();
        await supabase.auth.signOut();
    };

    const resetPassword = async (email: string) => {
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
