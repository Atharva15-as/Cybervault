import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, Activity, LayoutDashboard, LogOut, Users, ShieldAlert } from 'lucide-react';
import Logo from './Logo';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Features', path: '/features' },
    { name: 'How It Works', path: '/how-it-works' },
    { name: 'Scanner', path: '/scanner' },
    { name: 'Converter', path: '/converter' },
];

const userMenuItems = [
    { name: 'My Activity', path: '/activity', icon: Activity },
    { name: 'SIEM Tool', path: '/siem', icon: ShieldAlert },
    { name: 'Community', path: '/communities', icon: Users },
];

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { theme } = useTheme();
    const { user, signOut } = useAuth();
    const isDark = theme === 'dark';
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Text colors: Dark mode = light text, Light mode = dark text
    const textPrimary = isDark ? 'text-dark-200' : 'text-[#0F172A]';

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
                    ? 'bg-[#0b1220]/90 backdrop-blur-xl border-b border-[#334155]/50 py-3'
                    : 'bg-[#F2FAF6]/90 backdrop-blur-xl border-b border-[#CBD5E1]/50 py-3 shadow-sm'
                : 'bg-transparent py-5'
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/25 group-hover:shadow-primary-500/40 transition-all duration-300">
                                <Logo className="w-6 h-6" shieldClassName="text-white" lockClassName="text-white/90" />
                            </div>
                        </div>
                        <span className="text-xl font-bold font-heading">
                            <span className={textPrimary}>Cyber</span>
                            <span className="text-primary-500">Vault</span>
                        </span>
                    </Link>

                    {/* Theme Toggle & Auth Buttons */}
                    <div className="hidden md:flex items-center gap-4 ml-auto">
                        {/* Desktop Navigation */}
                        <div className="flex items-center gap-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${location.pathname === link.path
                                        ? 'text-primary-500 bg-primary-500/10'
                                        : isDark
                                            ? 'text-dark-400 hover:text-dark-200 hover:bg-[#1E293B]/50'
                                            : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#E4F3EC]'
                                        }`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>

                        {/* Logged in Navigation */}
                        {user && (
                            <div className={`flex items-center gap-1 ml-2 pl-3 border-l ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
                                <Link
                                    to="/dashboard"
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${location.pathname === '/dashboard'
                                        ? 'text-primary-500 bg-primary-500/10'
                                        : isDark
                                            ? 'text-dark-400 hover:text-dark-200 hover:bg-dark-800/50'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-[#E4F3EC]'
                                        }`}
                                >
                                    <LayoutDashboard className="h-4 w-4" />
                                    Dashboard
                                </Link>
                                <Link
                                    to="/communities"
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${location.pathname === '/communities' || location.pathname.startsWith('/community/')
                                        ? 'text-primary-500 bg-primary-500/10'
                                        : isDark
                                            ? 'text-dark-400 hover:text-dark-200 hover:bg-dark-800/50'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-[#E4F3EC]'
                                        }`}
                                >
                                    <Users className="h-4 w-4" />
                                    Communities
                                </Link>
                            </div>
                        )}

                        

                        {user ? (
                            /* User Profile Dropdown */
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 ${showUserMenu
                                        ? isDark ? 'bg-[#1E293B]' : 'bg-[#E4F3EC]'
                                        : isDark ? 'hover:bg-[#1E293B]' : 'hover:bg-[#E4F3EC]'
                                        }`}
                                >
                                    {/* Avatar */}
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-primary-500/25">
                                        {getUserInitials()}
                                    </div>
                                    {/* Name */}
                                    <span className={`text-sm font-medium max-w-[120px] truncate ${textPrimary}`}>
                                        {getUserDisplayName()}
                                    </span>
                                    <ChevronDown className={`h-4 w-4 transition-transform ${showUserMenu ? 'rotate-180' : ''} ${isDark ? 'text-dark-400' : 'text-[#64748B]'}`} />
                                </button>

                                {/* Dropdown Menu */}
                                {showUserMenu && (
                                    <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-xl border overflow-hidden animate-slide-up ${isDark
                                        ? 'bg-[#0F172A] border-[#334155]'
                                        : 'bg-[#F9FEFC] border-[#CBD5E1]'
                                        }`}>
                                        {/* User Info Header */}
                                        <div className={`px-4 py-3 border-b ${isDark ? 'border-[#334155]' : 'border-[#CBD5E1]'}`}>
                                            <p className={`text-sm font-medium ${textPrimary}`}>{getUserDisplayName()}</p>
                                            <p className={`text-xs truncate ${isDark ? 'text-dark-500' : 'text-[#94A3B8]'}`}>{user.email}</p>
                                        </div>

                                        {/* Menu Items */}
                                        <div className="py-2">
                                            {userMenuItems.map((item) => (
                                                <Link
                                                    key={item.name}
                                                    to={item.path}
                                                    className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isDark
                                                        ? 'text-dark-300 hover:text-dark-200 hover:bg-[#1E293B]'
                                                        : 'text-[#334155] hover:text-[#0F172A] hover:bg-[#E4F3EC]'
                                                        }`}
                                                    onClick={() => setShowUserMenu(false)}
                                                >
                                                    <item.icon className="h-4 w-4" />
                                                    {item.name}
                                                </Link>
                                            ))}
                                        </div>

                                        {/* Logout */}
                                        <div className={`border-t py-2 ${isDark ? 'border-[#334155]' : 'border-[#CBD5E1]'}`}>
                                            <button
                                                onClick={handleSignOut}
                                                className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors ${isDark
                                                    ? 'text-red-400 hover:text-red-300 hover:bg-[#1E293B]'
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
                            <div className="flex items-center gap-3 ml-2">
                                <Link
                                    to="/login"
                                    className="btn-secondary px-4 py-2 text-sm"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="btn-primary px-4 py-2 text-sm shadow-primary-500/25"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-2">
                        

                        {/* User Avatar - Mobile */}
                        {user && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-sm font-bold">
                                {getUserInitials()}
                            </div>
                        )}

                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className={`p-2 rounded-lg transition-colors ${isDark
                                ? 'text-dark-400 hover:text-dark-200 hover:bg-[#1E293B]'
                                : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#E4F3EC]'
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
                    ? 'bg-[#0b1220]/95 border-[#334155]/50'
                    : 'bg-[#F2FAF6]/95 border-[#CBD5E1]/50 shadow-lg'
                    }`}>
                    <div className="px-4 py-4 space-y-1">
                        {/* User Info - Mobile */}
                        {user && (
                            <div className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-xl ${isDark ? 'bg-[#1E293B]' : 'bg-[#E4F3EC]'}`}>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold">
                                    {getUserInitials()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium truncate ${textPrimary}`}>{getUserDisplayName()}</p>
                                    <p className={`text-xs truncate ${isDark ? 'text-dark-500' : 'text-[#94A3B8]'}`}>{user.email}</p>
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
                                        ? 'text-dark-400 hover:text-dark-200 hover:bg-dark-800/50'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-[#E4F3EC]'
                                    }`}
                            >
                                {link.name}
                            </Link>
                        ))}

                        {user && (
                            <>
                                <Link
                                    to="/dashboard"
                                    className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${location.pathname === '/dashboard'
                                        ? 'text-primary-500 bg-primary-500/10'
                                        : isDark
                                            ? 'text-dark-400 hover:text-dark-200 hover:bg-dark-800/50'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-[#E4F3EC]'
                                        }`}
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    to="/communities"
                                    className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${location.pathname === '/communities' || location.pathname.startsWith('/community/')
                                        ? 'text-primary-500 bg-primary-500/10'
                                        : isDark
                                            ? 'text-dark-400 hover:text-dark-200 hover:bg-dark-800/50'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-[#E4F3EC]'
                                        }`}
                                >
                                    Communities
                                </Link>
                            </>
                        )}

                        {user ? (
                            <>
                                {/* User Menu Items - Mobile */}
                                <div className={`pt-4 space-y-1 border-t mt-4 ${isDark ? 'border-[#334155]' : 'border-[#CBD5E1]'}`}>
                                    {userMenuItems.map((item) => (
                                        <Link
                                            key={item.name}
                                            to={item.path}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${isDark
                                                ? 'text-dark-400 hover:text-dark-200 hover:bg-[#1E293B]/50'
                                                : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#E4F3EC]'
                                                }`}
                                        >
                                            <item.icon className="h-5 w-5" />
                                            {item.name}
                                        </Link>
                                    ))}
                                </div>

                                {/* Logout - Mobile */}
                                <div className={`pt-4 border-t mt-4 ${isDark ? 'border-[#334155]' : 'border-[#CBD5E1]'}`}>
                                    <button
                                        onClick={handleSignOut}
                                        className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-base font-medium transition-colors ${isDark
                                            ? 'text-red-400 hover:text-red-300 hover:bg-[#1E293B]/50'
                                            : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                                            }`}
                                    >
                                        <LogOut className="h-5 w-5" />
                                        Log Out
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className={`pt-4 space-y-3 border-t mt-4 px-2 ${isDark ? 'border-[#334155]' : 'border-[#CBD5E1]'}`}>
                                <Link
                                    to="/login"
                                    className="btn-secondary w-full text-center"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="btn-primary w-full text-center shadow-primary-500/25"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
