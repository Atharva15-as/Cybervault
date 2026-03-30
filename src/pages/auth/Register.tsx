import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import PasswordStrengthMeter from '../../components/PasswordStrengthMeter';

export default function Register() {

    const { signUp, signInWithGoogle, signInWithGitHub } = useAuth();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Text colors
    const textPrimary = isDark ? 'text-white' : 'text-[#0F172A]';
    const textMuted = isDark ? 'text-dark-400' : 'text-[#64748B]';
    const textSubtle = isDark ? 'text-[#94A3B8]' : 'text-[#94A3B8]';

    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        agreeTerms: false,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState<'google' | 'github' | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        if (!/[A-Z]/.test(formData.password)) {
            setError('Password must contain at least one uppercase letter');
            return;
        }

        if (!/[0-9]/.test(formData.password)) {
            setError('Password must contain at least one number');
            return;
        }

        setIsLoading(true);
        setError(null);

        const { error } = await signUp(formData.email, formData.password, formData.name);

        if (error) {
            setError(error.message);
            setIsLoading(false);
        } else {
            setSuccess(true);
        }
    };

    const handleGoogleLogin = async () => {
        setSocialLoading('google');
        await signInWithGoogle();
    };

    const handleGitHubLogin = async () => {
        setSocialLoading('github');
        await signInWithGitHub();
    };

    const passwordRequirements = [
        { label: 'At least 8 characters', met: formData.password.length >= 8 },
        { label: 'Contains uppercase letter', met: /[A-Z]/.test(formData.password) },
        { label: 'Contains number', met: /[0-9]/.test(formData.password) },
        { label: 'Passwords match', met: formData.password === formData.confirmPassword && formData.confirmPassword !== '' },
    ];

    if (success) {
        return (
            <div className="min-h-screen flex flex-col pt-24 px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-md text-center mx-auto my-auto pb-12">
                    <div className="glass-card p-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-6">
                            <Check className="h-8 w-8 text-green-500" />
                        </div>
                        <h2 className={`text-2xl font-bold mb-2 ${textPrimary}`}>Check your email!</h2>
                        <p className={`${textMuted} mb-6`}>
                            We've sent a confirmation link to <strong className={textPrimary}>{formData.email}</strong>.
                            Please click the link to verify your account.
                        </p>
                        <Link to="/login" className="btn-primary">
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col pt-20 pb-4 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-[420px] mx-auto my-auto">
                <div className="text-center mb-6">
                    <h1 className={`text-2xl font-bold mb-1 ${textPrimary}`}>Create your account</h1>
                    <p className={`text-sm ${textMuted}`}>Start securing your files today</p>
                </div>

                {/* Register Form */}
                <div className="glass-card p-6">
                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-xs text-center">
                            {error}
                        </div>
                    )}

                    {/* Social Login */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <button
                            onClick={handleGoogleLogin}
                            disabled={socialLoading !== null}
                            className="btn-secondary justify-center disabled:opacity-50"
                        >
                            {socialLoading === 'google' ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                                        <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#4285F4" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Google
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleGitHubLogin}
                            disabled={socialLoading !== null}
                            className="btn-secondary justify-center disabled:opacity-50"
                        >
                            {socialLoading === 'github' ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                    GitHub
                                </>
                            )}
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="relative mb-4">
                        <div className={`absolute inset-0 flex items-center`}>
                            <div className={`w-full border-t ${isDark ? 'border-[#334155]' : 'border-[#CBD5E1]'}`}></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className={`px-2 ${isDark ? 'bg-dark-900 text-gray-500' : 'bg-white text-gray-500'}`}>
                                or register with email
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Full Name */}
                        <div className="mb-4">
                            <label htmlFor="name" className={`block text-sm font-medium mb-1.5 ${textMuted}`}>
                                Full Name
                            </label>
                            <div className="relative">
                                <User className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 ${textSubtle}`} />
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="John Doe"
                                    className="input-field pl-12"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="mb-4">
                            <label htmlFor="email" className={`block text-sm font-medium mb-1.5 ${textMuted}`}>
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 ${textSubtle}`} />
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="john@example.com"
                                    className="input-field pl-12"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="mb-4">
                            <label htmlFor="password" className={`block text-sm font-medium mb-1.5 ${textMuted}`}>
                                Password
                            </label>
                            <div className="relative">
                                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 ${textSubtle}`} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="Create a strong password"
                                    className="input-field pl-12 pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className={`absolute right-4 top-1/2 -translate-y-1/2 ${textSubtle} hover:${textMuted}`}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            <PasswordStrengthMeter password={formData.password} />
                        </div>

                        {/* Confirm Password */}
                        <div className="mb-4">
                            <label htmlFor="confirmPassword" className={`block text-sm font-medium mb-1.5 ${textMuted}`}>
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 ${textSubtle}`} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    placeholder="Confirm your password"
                                    className="input-field pl-12"
                                />
                            </div>
                        </div>

                        {/* Password Requirements */}
                        <div className={`mb-4 p-3 rounded-lg ${isDark ? 'bg-dark-800/50' : 'bg-[#E4F3EC]'}`}>
                            <p className={`text-xs mb-1.5 ${textSubtle}`}>Password requirements:</p>
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                                {passwordRequirements.map((req) => (
                                    <div key={req.label} className="flex items-center gap-2">
                                        <div
                                            className={`w-4 h-4 rounded-full flex items-center justify-center ${req.met
                                                ? 'bg-green-500/20 text-green-500'
                                                : isDark ? 'bg-dark-600' : 'bg-gray-200'
                                                }`}
                                        >
                                            {req.met && <Check className="h-3 w-3" />}
                                        </div>
                                        <span className={`text-xs ${req.met ? 'text-green-500' : textSubtle}`}>
                                            {req.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Terms Agreement */}
                        <div className="mb-5">
                            <label className="flex items-start gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="agreeTerms"
                                    checked={formData.agreeTerms}
                                    onChange={handleChange}
                                    required
                                    className={`mt-1 w-4 h-4 rounded text-primary-500 focus:ring-primary-500 ${isDark ? 'border-gray-600 bg-[#1E293B]' : 'border-gray-300 bg-white'}`}
                                />
                                <span className={`text-sm ${textMuted}`}>
                                    I agree to the{' '}
                                    <Link to="/terms" className="text-primary-500 hover:underline">
                                        Terms of Service
                                    </Link>{' '}
                                    and{' '}
                                    <Link to="/privacy" className="text-primary-500 hover:underline">
                                        Privacy Policy
                                    </Link>
                                </span>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full justify-center"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    Creating account...
                                </>
                            ) : (
                                <>
                                    Create Account
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Login Link */}
                <p className={`text-center mt-6 ${textMuted}`}>
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary-500 hover:text-primary-400 font-medium">
                        Sign in
                    </Link>
                </p>
            </div>

        </div>
    );
}
