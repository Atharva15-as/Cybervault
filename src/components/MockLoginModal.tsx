import { useState } from 'react';
import { X, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface MockLoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: (email: string) => void;
    provider: 'google' | 'github';
}

export default function MockLoginModal({ isOpen, onClose, onLogin, provider }: MockLoginModalProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulate network delay
        setTimeout(() => {
            setLoading(false);
            onLogin(email);
            onClose();
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full max-w-md p-6 rounded-2xl shadow-xl animate-scale-up ${isDark ? 'bg-dark-900 border border-dark-700' : 'bg-white'}`}>

                {/* Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white mb-4 shadow-md">
                        {provider === 'google' ? (
                            <svg className="w-6 h-6" viewBox="0 0 24 24">
                                <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#4285F4" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                        )}
                    </div>
                    <h3 className={`text-xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Sign in with {provider === 'google' ? 'Google' : 'GitHub'}
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Enter your credentials to continue
                    </p>
                </div>

                {/* Simulated Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Email or Phone
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={`w-full pl-9 pr-4 py-2.5 rounded-lg text-sm border focus:ring-2 outline-none transition-all ${isDark
                                    ? 'bg-dark-800 border-dark-600 text-white focus:ring-primary-500/50 focus:border-primary-500'
                                    : 'bg-gray-50 border-gray-200 text-gray-900 focus:ring-primary-500/30 focus:border-primary-500'
                                    }`}
                                placeholder="name@example.com"
                                autoFocus
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`w-full pl-9 pr-4 py-2.5 rounded-lg text-sm border focus:ring-2 outline-none transition-all ${isDark
                                    ? 'bg-dark-800 border-dark-600 text-white focus:ring-primary-500/50 focus:border-primary-500'
                                    : 'bg-gray-50 border-gray-200 text-gray-900 focus:ring-primary-500/30 focus:border-primary-500'
                                    }`}
                                placeholder="Enter your password"
                                required
                            />
                        </div>
                    </div>

                    <div className={`flex items-start gap-2 p-3 rounded-lg text-xs ${isDark ? 'bg-yellow-500/10 text-yellow-200' : 'bg-yellow-50 text-yellow-800'}`}>
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <p>This is a simulated login for the demo. No data is sent to Google/GitHub.</p>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${isDark
                                ? 'bg-dark-800 text-gray-300 hover:bg-dark-700'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !email || !password}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-all flex items-center justify-center ${loading
                                ? 'bg-primary-500/70 cursor-wait'
                                : 'bg-primary-500 hover:bg-primary-600 shadow-lg shadow-primary-500/25'
                                }`}
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
                        </button>
                    </div>
                </form>

                <button
                    onClick={onClose}
                    className={`absolute top-4 right-4 p-1 rounded-lg transition-colors ${isDark ? 'text-gray-500 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-900 hover:bg-black/5'
                        }`}
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
