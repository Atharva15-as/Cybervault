import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle, Loader2 } from 'lucide-react';
import Logo from '../../components/Logo';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function ForgotPassword() {
    const { resetPassword } = useAuth();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Text colors
    const textPrimary = isDark ? 'text-white' : 'text-gray-900';
    const textMuted = isDark ? 'text-gray-400' : 'text-gray-600';
    const textSubtle = isDark ? 'text-gray-500' : 'text-gray-500';

    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const { error } = await resetPassword(email);

        if (error) {
            setError(error.message);
            setIsLoading(false);
        } else {
            setSubmitted(true);
        }
    };

    return (
        <div className="min-h-screen pt-20 flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2 mb-6">
                        <Logo className="w-12 h-12" shieldClassName="text-primary-500" lockClassName="text-primary-500" />
                        <span className="text-2xl font-bold font-heading">
                            <span className={textPrimary}>Cyber</span>
                            <span className="text-primary-500">Vault</span>
                        </span>
                    </Link>
                    <h1 className={`text-2xl font-bold mb-2 ${textPrimary}`}>Reset your password</h1>
                    <p className={textMuted}>We'll send you a link to reset your password</p>
                </div>

                {/* Form */}
                <div className="glass-card p-8">
                    {submitted ? (
                        <div className="text-center py-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-6">
                                <CheckCircle className="h-8 w-8 text-green-500" />
                            </div>
                            <h3 className={`text-xl font-bold mb-3 ${textPrimary}`}>Check your email</h3>
                            <p className={`${textMuted} mb-6`}>
                                We've sent a password reset link to <span className={textPrimary}>{email}</span>
                            </p>
                            <p className={`text-sm mb-6 ${textSubtle}`}>
                                Didn't receive the email? Check your spam folder or try again.
                            </p>
                            <button
                                onClick={() => {
                                    setSubmitted(false);
                                    setEmail('');
                                }}
                                className="btn-secondary"
                            >
                                Try again
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            {/* Error Message */}
                            {error && (
                                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="mb-6">
                                <label htmlFor="email" className={`block text-sm font-medium mb-2 ${textMuted}`}>
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 ${textSubtle}`} />
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="Enter your email"
                                        className="input-field pl-12"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn-primary w-full justify-center mb-4"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-5 w-5 mr-2" />
                                        Send Reset Link
                                    </>
                                )}
                            </button>

                            <Link
                                to="/login"
                                className={`flex items-center justify-center gap-2 ${textMuted} hover:${textPrimary} transition-colors`}
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to login
                            </Link>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
