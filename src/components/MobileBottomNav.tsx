import { Link, useLocation } from 'react-router-dom';
import { Home, Shield, LayoutDashboard, Users, Lock } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Shield, label: 'Scanner', path: '/scanner' },
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', auth: true },
    { icon: Users, label: 'Community', path: '/communities', auth: true },
    { icon: Lock, label: 'Workspace', path: '/workspace', auth: true },
];

export default function MobileBottomNav() {
    const location = useLocation();
    const { theme } = useTheme();
    const { user } = useAuth();
    const isDark = theme === 'dark';

    const filteredItems = navItems.filter(item => !item.auth || user);

    return (
        <nav
            className={`fixed bottom-0 left-0 right-0 z-50 md:hidden border-t backdrop-blur-xl transition-colors ${isDark
                ? 'bg-dark-950/95 border-[#334155]'
                : 'bg-white/95 border-[#CBD5E1]'
                }`}
            id="mobile-bottom-nav"
        >
            <div className="flex items-center justify-around px-2 py-1 safe-area-bottom">
                {filteredItems.map(item => {
                    const isActive = location.pathname === item.path ||
                        (item.path !== '/' && location.pathname.startsWith(item.path));

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 min-w-[56px] ${isActive
                                ? 'text-primary-500'
                                : isDark
                                    ? 'text-gray-500 hover:text-gray-300'
                                    : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <div className={`relative p-1 rounded-lg transition-all ${isActive ? 'bg-primary-500/10 scale-110' : ''}`}>
                                <item.icon className="h-5 w-5" />
                                {isActive && (
                                    <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-500" />
                                )}
                            </div>
                            <span className={`text-[10px] font-medium ${isActive ? 'text-primary-500' : ''}`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
