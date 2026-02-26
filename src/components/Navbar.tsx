import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Sun, Moon, ChevronDown, Activity, FolderOpen, LayoutDashboard, History, LogOut, Users } from 'lucide-react';
import Logo from './Logo';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Features', path: '/features' },
    { name: 'How It Works', path: '/how-it-works' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
    { name: 'Scanner', path: '/scanner' },
];

const userMenuItems = [
    { name: 'My Activity', path: '/activity', icon: Activity },
    { name: 'My Folder', path: '/dashboard', icon: FolderOpen },
    { name: 'My Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Communities', path: '/communities', icon: Users },
    { name: 'History', path: '/dashboard', icon: History },
];

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const { user, signOut } = useAuth();
    const isDark = theme === 'dark';
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Text colors: Dark mode = light text, Light mode = dark text
    const textPrimary = isDark ? 'text-white' : 'text-gray-900';

    // Get user display name
    const getUserDisplayName = () => {
        if (!user) return '';
        if (user.user_metadata?.full_name) return user.user_metadata.full_name;
        if (user.user_metadata?.name) return user.user_metadata.name;
        if (user.email) return user.email.split('@')[0];
        return 'User';
    };

    // Get user initials for avatar
    const getUserInitials = () => {
        const name = getUserDisplayName();
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setIsOpen(false);
        setShowUserMenu(false);
    }, [location]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        await signOut();
        setShowUserMenu(false);
        navigate('/');
    };

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                ? isDark
                    ? 'bg-dark-950/90 backdrop-blur-xl border-b border-dark-800/50 py-3'
                    : 'bg-white/90 backdrop-blur-xl border-b border-gray-200/50 py-3 shadow-sm'
                : 'bg-transparent py-5'
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center shadow-lg shadow-primary-500/25 group-hover:shadow-primary-500/40 transition-all duration-300">
                                <Logo className="w-6 h-6" shieldClassName="text-white" lockClassName="text-white/90" />
                            </div>
                        </div>
                        <span className="text-xl font-bold font-heading">
                            <span className={textPrimary}>Cyber</span>
                            <span className="text-primary-500">Vault</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${location.pathname === link.path
                                    ? 'text-primary-500 bg-primary-500/10'
                                    : isDark
                                        ? 'text-gray-400 hover:text-white hover:bg-dark-800/50'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>


                    {/* Theme Toggle & Auth Buttons */}
                    <div className="hidden md:flex items-center gap-3">
                        {/* Communities Button - Shows when logged in */}
                        {user && (
                            <Link
                                to="/communities"
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${location.pathname === '/communities' || location.pathname.startsWith('/community/')
                                    ? 'text-primary-500 bg-primary-500/10'
                                    : isDark
                                        ? 'text-gray-400 hover:text-white hover:bg-dark-800/50'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                            >
                                <Users className="h-4 w-4" />
                                Communities
                            </Link>
                        )}

                        {/* Theme Toggle Button */}
                        <button
                            onClick={toggleTheme}
                            className={`p-2 rounded-lg transition-all duration-300 ${isDark
                                ? 'text-gray-400 hover:text-yellow-400 hover:bg-dark-800'
                                : 'text-gray-600 hover:text-primary-600 hover:bg-gray-100'
                                }`}
                            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                        >
                            {isDark ? (
                                <Sun className="h-5 w-5" />
                            ) : (
                                <Moon className="h-5 w-5" />
                            )}
                        </button>

                        {user ? (
                            /* User Profile Dropdown */
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 ${showUserMenu
                                        ? isDark ? 'bg-dark-800' : 'bg-gray-100'
                                        : isDark ? 'hover:bg-dark-800' : 'hover:bg-gray-100'
                                        }`}
                                >
                                    {/* Avatar */}
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-primary-500/25">
                                        {getUserInitials()}
                                    </div>
                                    {/* Name */}
                                    <span className={`text-sm font-medium max-w-[120px] truncate ${textPrimary}`}>
                                        {getUserDisplayName()}
                                    </span>
                                    <ChevronDown className={`h-4 w-4 transition-transform ${showUserMenu ? 'rotate-180' : ''} ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                                </button>

                                {/* Dropdown Menu */}
                                {showUserMenu && (
                                    <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-xl border overflow-hidden animate-slide-up ${isDark
                                        ? 'bg-dark-900 border-dark-700'
                                        : 'bg-white border-gray-200'
                                        }`}>
                                        {/* User Info Header */}
                                        <div className={`px-4 py-3 border-b ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
                                            <p className={`text-sm font-medium ${textPrimary}`}>{getUserDisplayName()}</p>
                                            <p className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{user.email}</p>
                                        </div>

                                        {/* Menu Items */}
                                        <div className="py-2">
                                            {userMenuItems.map((item) => (
                                                <Link
                                                    key={item.name}
                                                    to={item.path}
                                                    className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isDark
                                                        ? 'text-gray-300 hover:text-white hover:bg-dark-800'
                                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                                        }`}
                                                    onClick={() => setShowUserMenu(false)}
                                                >
                                                    <item.icon className="h-4 w-4" />
                                                    {item.name}
                                                </Link>
                                            ))}
                                        </div>

                                        {/* Logout */}
                                        <div className={`border-t py-2 ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
                                            <button
                                                onClick={handleSignOut}
                                                className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors ${isDark
                                                    ? 'text-red-400 hover:text-red-300 hover:bg-dark-800'
                                                    : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                                                    }`}
                                            >
                                                <LogOut className="h-4 w-4" />
                                                Log Out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Login/Register Buttons */
                            <>
                                <Link
                                    to="/login"
                                    className={`px-4 py-2 text-sm font-medium transition-colors ${isDark
                                        ? 'text-gray-300 hover:text-white'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="btn-primary text-sm py-2"
                                >
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-2">
                        {/* Theme Toggle - Mobile */}
                        <button
                            onClick={toggleTheme}
                            className={`p-2 rounded-lg transition-colors ${isDark
                                ? 'text-gray-400 hover:text-yellow-400 hover:bg-dark-800'
                                : 'text-gray-600 hover:text-primary-600 hover:bg-gray-100'
                                }`}
                            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                        >
                            {isDark ? (
                                <Sun className="h-5 w-5" />
                            ) : (
                                <Moon className="h-5 w-5" />
                            )}
                        </button>

                        {/* User Avatar - Mobile */}
                        {user && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                                {getUserInitials()}
                            </div>
                        )}

                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className={`p-2 rounded-lg transition-colors ${isDark
                                ? 'text-gray-400 hover:text-white hover:bg-dark-800'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                        >
                            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            {isOpen && (
                <div className={`md:hidden absolute top-full left-0 right-0 backdrop-blur-xl border-b animate-slide-up ${isDark
                    ? 'bg-dark-950/95 border-dark-800/50'
                    : 'bg-white/95 border-gray-200/50 shadow-lg'
                    }`}>
                    <div className="px-4 py-4 space-y-1">
                        {/* User Info - Mobile */}
                        {user && (
                            <div className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-xl ${isDark ? 'bg-dark-800' : 'bg-gray-100'}`}>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center text-white font-bold">
                                    {getUserInitials()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium truncate ${textPrimary}`}>{getUserDisplayName()}</p>
                                    <p className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{user.email}</p>
                                </div>
                            </div>
                        )}

                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${location.pathname === link.path
                                    ? 'text-primary-500 bg-primary-500/10'
                                    : isDark
                                        ? 'text-gray-400 hover:text-white hover:bg-dark-800/50'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                            >
                                {link.name}
                            </Link>
                        ))}

                        {user ? (
                            <>
                                {/* User Menu Items - Mobile */}
                                <div className={`pt-4 space-y-1 border-t mt-4 ${isDark ? 'border-dark-800' : 'border-gray-200'}`}>
                                    {userMenuItems.map((item) => (
                                        <Link
                                            key={item.name}
                                            to={item.path}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${isDark
                                                ? 'text-gray-400 hover:text-white hover:bg-dark-800/50'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                                }`}
                                        >
                                            <item.icon className="h-5 w-5" />
                                            {item.name}
                                        </Link>
                                    ))}
                                </div>

                                {/* Logout - Mobile */}
                                <div className={`pt-4 border-t mt-4 ${isDark ? 'border-dark-800' : 'border-gray-200'}`}>
                                    <button
                                        onClick={handleSignOut}
                                        className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-base font-medium transition-colors ${isDark
                                            ? 'text-red-400 hover:text-red-300 hover:bg-dark-800/50'
                                            : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                                            }`}
                                    >
                                        <LogOut className="h-5 w-5" />
                                        Log Out
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className={`pt-4 space-y-2 border-t mt-4 ${isDark ? 'border-dark-800' : 'border-gray-200'}`}>
                                <Link
                                    to="/login"
                                    className={`block px-4 py-3 text-center transition-colors ${isDark
                                        ? 'text-gray-300 hover:text-white'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="block btn-primary text-center"
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
