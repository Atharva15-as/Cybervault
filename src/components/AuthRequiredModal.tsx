import { useNavigate } from 'react-router-dom';
import { Lock, LogIn, UserPlus, FileIcon, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface AuthRequiredModalProps {
    isOpen: boolean;
    onClose: () => void;
    action: 'download' | 'share';
    fileName?: string;
    inline?: boolean;
}

export default function AuthRequiredModal({ isOpen, onClose, action, fileName, inline = false }: AuthRequiredModalProps) {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const isDark = theme === 'dark';

    if (!isOpen) return null;

    const handleLoginClick = () => {
        onClose();
        navigate('/login');
    };

    const handleSignUpClick = () => {
        onClose();
        navigate('/register');
    };

    const content = (
        <div className={`relative w-full max-w-md p-8 rounded-2xl shadow-2xl animate-scale-up ${isDark ? 'bg-[#0F172A] border border-[#334155]' : 'bg-[#F9FEFC]'} ${inline ? 'mx-auto lg:mx-0 text-left' : 'mx-auto'}`}>

            {/* Close button */}
            <button
                onClick={onClose}
                className={`absolute top-4 right-4 p-1 rounded-lg transition-colors ${isDark ? 'text-dark-400 hover:text-dark-200 hover:bg-white/10' : 'text-[#64748B] hover:text-[#0F172A] hover:bg-black/5'}`}
            >
                <X className="w-5 h-5" />
            </button>

            {/* Lock Icon */}
            <div className="flex justify-center mb-5">
                <div className="w-16 h-16 rounded-2xl bg-primary-500/15 flex items-center justify-center">
                    <Lock className="w-8 h-8 text-primary-500" />
                </div>
            </div>

            {/* Header */}
            <div className="text-center mb-5">
                <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-dark-200' : 'text-[#0F172A]'}`}>
                    Authentication Required
                </h3>
                <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-[#64748B]'}`}>
                    Please sign in or create an account to {action} files securely.
                </p>
            </div>

            {/* File info */}
            {fileName && (
                <div className={`flex items-center gap-3 p-3 rounded-xl mb-6 ${isDark ? 'bg-[#1E293B]' : 'bg-[#E4F3EC]'}`}>
                    <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                        <FileIcon className="h-5 w-5 text-primary-500" />
                    </div>
                    <div className="min-w-0">
                        <p className={`text-xs ${isDark ? 'text-dark-400' : 'text-[#64748B]'}`}>
                            Sign in to {action} this file
                        </p>
                        <p className={`font-medium text-sm truncate ${isDark ? 'text-dark-200' : 'text-[#0F172A]'}`}>
                            {fileName}
                        </p>
                    </div>
                </div>
            )}

            {/* Login Button */}
            <button
                onClick={handleLoginClick}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 mb-3"
            >
                <LogIn className="w-5 h-5" />
                Sign In
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-4">
                <div className={`flex-1 h-px ${isDark ? 'bg-[#334155]' : 'bg-[#CBD5E1]'}`} />
                <span className={`text-xs ${isDark ? 'text-dark-500' : 'text-[#94A3B8]'}`}>new here?</span>
                <div className={`flex-1 h-px ${isDark ? 'bg-[#334155]' : 'bg-[#CBD5E1]'}`} />
            </div>

            {/* Create Account Button */}
            <button
                onClick={handleSignUpClick}
                className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors border ${isDark
                    ? 'border-[#334155] text-dark-300 hover:bg-[#1E293B] hover:border-dark-400'
                    : 'border-[#CBD5E1] text-[#334155] hover:bg-[#E4F3EC] hover:border-[#94A3B8]'
                    }`}
            >
                <UserPlus className="w-5 h-5" />
                Create Account
            </button>
        </div>
    );

    if (inline) {
        return content;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            {content}
        </div>
    );
}
