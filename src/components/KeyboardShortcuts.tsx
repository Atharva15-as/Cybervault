import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
    Keyboard,
    X,
    Upload,
    Search,
    Sun,
    Moon,
    Home,
    Shield,
    LayoutDashboard,
    Lock,
    HelpCircle,
} from 'lucide-react';

interface Shortcut {
    keys: string[];
    description: string;
    icon: React.ElementType;
    action?: () => void;
}

interface KeyboardShortcutsProps {
    onNavigate: (path: string) => void;
    onToggleTheme: () => void;
}

export default function KeyboardShortcuts({ onNavigate, onToggleTheme }: KeyboardShortcutsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const shortcuts: Shortcut[] = [
        { keys: ['?'], description: 'Open keyboard shortcuts', icon: HelpCircle },
        { keys: ['Ctrl', 'K'], description: 'Search files', icon: Search },
        { keys: ['Ctrl', 'U'], description: 'Upload file', icon: Upload },
        { keys: ['Ctrl', 'D'], description: 'Go to Dashboard', icon: LayoutDashboard, action: () => onNavigate('/dashboard') },
        { keys: ['Ctrl', 'E'], description: 'Go to Vault Workspace', icon: Lock, action: () => onNavigate('/workspace') },
        { keys: ['Ctrl', 'H'], description: 'Go to Home', icon: Home, action: () => onNavigate('/') },
        { keys: ['Ctrl', 'S'], description: 'Go to Scanner', icon: Shield, action: () => onNavigate('/scanner') },
        { keys: ['Ctrl', 'T'], description: 'Toggle theme', icon: isDark ? Sun : Moon, action: onToggleTheme },
        { keys: ['Esc'], description: 'Close modal / panel', icon: X },
    ];

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // '?' key opens shortcuts modal
        if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
            e.preventDefault();
            setIsOpen(prev => !prev);
            return;
        }

        // Escape closes
        if (e.key === 'Escape') {
            setIsOpen(false);
            return;
        }

        // Ctrl shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'd':
                    e.preventDefault();
                    onNavigate('/dashboard');
                    break;
                case 'h':
                    e.preventDefault();
                    onNavigate('/');
                    break;
                case 'e':
                    e.preventDefault();
                    onNavigate('/workspace');
                    break;
                case 's':
                    // Only capture if not in an input
                    if (!(e.target as HTMLElement).closest('input, textarea')) {
                        e.preventDefault();
                        onNavigate('/scanner');
                    }
                    break;
                case 't':
                    e.preventDefault();
                    onToggleTheme();
                    break;
            }
        }
    }, [onNavigate, onToggleTheme]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[90] p-4 animate-fade-in" onClick={() => setIsOpen(false)}>
            <div
                className={`w-full max-w-lg rounded-2xl shadow-2xl border animate-slide-up overflow-hidden ${isDark ? 'bg-dark-900 border-[#334155]' : 'bg-[#F9FEFC] border-[#CBD5E1]'
                    }`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-[#334155]' : 'border-[#CBD5E1]'}`}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
                            <Keyboard className="h-5 w-5 text-primary-500" />
                        </div>
                        <div>
                            <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>Keyboard Shortcuts</h2>
                            <p className={`text-xs ${isDark ? 'text-dark-400' : 'text-[#94A3B8]'}`}>Navigate faster with hotkeys</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-dark-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Shortcuts List */}
                <div className="p-4 space-y-1 max-h-[60vh] overflow-y-auto">
                    {shortcuts.map((shortcut, index) => (
                        <div
                            key={index}
                            className={`flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${isDark ? 'hover:bg-dark-800/50' : 'hover:bg-[#E4F3EC]'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <shortcut.icon className={`h-4 w-4 ${isDark ? 'text-dark-400' : 'text-[#94A3B8]'}`} />
                                <span className={`text-sm ${isDark ? 'text-dark-300' : 'text-[#334155]'}`}>
                                    {shortcut.description}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                {shortcut.keys.map((key, i) => (
                                    <span key={i}>
                                        <kbd className={`inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg text-xs font-medium border ${isDark
                                            ? 'bg-dark-700 border-dark-600 text-gray-300'
                                            : 'bg-gray-100 border-gray-300 text-gray-700'
                                            }`}>
                                            {key}
                                        </kbd>
                                        {i < shortcut.keys.length - 1 && (
                                            <span className={`mx-1 text-xs ${isDark ? 'text-[#64748B]' : 'text-dark-400'}`}>+</span>
                                        )}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className={`px-6 py-3 border-t text-center ${isDark ? 'border-[#334155]' : 'border-[#CBD5E1]'}`}>
                    <p className={`text-xs ${isDark ? 'text-[#94A3B8]' : 'text-dark-400'}`}>
                        Press <kbd className={`px-1.5 py-0.5 rounded text-xs border ${isDark ? 'bg-dark-700 border-[#334155]' : 'bg-gray-100 border-gray-300'}`}>?</kbd> anywhere to toggle this panel
                    </p>
                </div>
            </div>
        </div>
    );
}
