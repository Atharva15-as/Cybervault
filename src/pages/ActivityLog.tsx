import { useState, useEffect } from 'react';
import {
    Activity,
    Upload,
    Download,
    Share2,
    Trash2,
    LogIn,
    LogOut,
    Shield,
    Globe,
    Users,
    Settings,
    Clock,
    Filter,
    RotateCcw,
    Search,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { activityService, ActivityEntry, ActivityType } from '../services/activityService';

const activityIcons: Record<ActivityType, React.ElementType> = {
    file_upload: Upload,
    file_download: Download,
    file_share: Share2,
    file_delete: Trash2,
    login: LogIn,
    logout: LogOut,
    scan_file: Shield,
    scan_url: Globe,
    community_create: Users,
    community_join: Users,
    settings_change: Settings,
};

const activityColors: Record<ActivityType, string> = {
    file_upload: 'text-primary-500 bg-primary-500/10',
    file_download: 'text-green-500 bg-green-500/10',
    file_share: 'text-primary-500 bg-primary-500/10',
    file_delete: 'text-red-500 bg-red-500/10',
    login: 'text-emerald-500 bg-emerald-500/10',
    logout: 'text-orange-500 bg-orange-500/10',
    scan_file: 'text-purple-500 bg-purple-500/10',
    scan_url: 'text-indigo-500 bg-indigo-500/10',
    community_create: 'text-pink-500 bg-pink-500/10',
    community_join: 'text-teal-500 bg-teal-500/10',
    settings_change: 'text-gray-500 bg-gray-500/10',
};

function formatTimeAgo(timestamp: string): string {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ActivityLog() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [activities, setActivities] = useState<ActivityEntry[]>([]);
    const [filter, setFilter] = useState<ActivityType | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showAllActivities, setShowAllActivities] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const textPrimary = isDark ? 'text-white' : 'text-[#0F172A]';
    const textMuted = isDark ? 'text-dark-400' : 'text-[#64748B]';

    useEffect(() => {
        loadActivities();
    }, []);

    const loadActivities = () => {
        activityService.pruneOldAndInvalid();
        setActivities(activityService.getAll());
    };

    const stats = activityService.getStats();

    const filteredActivities = activities
        .filter(a => filter === 'all' || a.type === filter)
        .filter(a =>
            searchQuery === '' ||
            a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
    const visibleActivities = showAllActivities ? filteredActivities : filteredActivities.slice(0, 4);

    useEffect(() => {
        setShowAllActivities(false);
    }, [filter, searchQuery]);

    const filterOptions: { value: ActivityType | 'all'; label: string }[] = [
        { value: 'all', label: 'All' },
        { value: 'file_upload', label: 'Uploads' },
        { value: 'file_download', label: 'Downloads' },
        { value: 'file_share', label: 'Shares' },
        { value: 'scan_file', label: 'Scans' },
        { value: 'login', label: 'Auth' },
    ];

    return (
        <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 min-h-screen">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-4">
                            <Activity className="h-4 w-4 text-primary-500" />
                            <span className="text-sm text-primary-500 font-medium">Activity Log</span>
                        </div>
                        <h1 className={`text-2xl font-bold mb-1 ${textPrimary}`}>Your Activity</h1>
                        <p className={textMuted}>Track all your actions and operations</p>
                    </div>
                    <button
                        onClick={() => setShowClearConfirm(true)}
                        className="btn-secondary text-sm"
                    >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Clear Log
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Today', value: stats.today, icon: Clock, color: 'text-primary-500' },
                        { label: 'Uploads', value: stats.uploads, icon: Upload, color: 'text-primary-500' },
                        { label: 'Shares', value: stats.shares, icon: Share2, color: 'text-green-500' },
                        { label: 'Scans', value: stats.scans, icon: Shield, color: 'text-purple-500' },
                    ].map(stat => (
                        <div key={stat.label} className="glass-card p-4 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl ${stat.color.replace('text-', 'bg-').replace('500', '500/10')} flex items-center justify-center`}>
                                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                            </div>
                            <div>
                                <p className={`text-2xl font-bold ${textPrimary}`}>{stat.value}</p>
                                <p className={`text-xs ${textMuted}`}>{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Search & Filter */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 ${textMuted}`} />
                        <input
                            type="text"
                            placeholder="Search activities..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-field pl-12"
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {filterOptions.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setFilter(opt.value)}
                                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${filter === opt.value
                                    ? 'bg-primary-500 text-white'
                                    : isDark
                                        ? 'bg-dark-800 text-dark-400 hover:text-dark-200 hover:bg-[#334155]'
                                        : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Activity Timeline */}
                <div className="glass-card overflow-hidden">
                    {filteredActivities.length === 0 ? (
                        <div className="text-center py-16">
                            <Filter className={`h-12 w-12 mx-auto mb-4 ${textMuted}`} />
                            <p className={`text-lg font-medium mb-1 ${textPrimary}`}>No activities found</p>
                            <p className={textMuted}>Your activity history will appear here</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-dark-700/50">
                            {visibleActivities.map((activity) => {
                                const Icon = activityIcons[activity.type] || Activity;
                                const colorClass = activityColors[activity.type] || 'text-gray-500 bg-gray-500/10';

                                return (
                                    <div
                                        key={activity.id}
                                        className={`flex items-center gap-4 px-6 py-4 transition-colors ${isDark ? 'hover:bg-dark-800/30' : 'hover:bg-[#E4F3EC]'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-medium text-sm ${textPrimary}`}>{activity.title}</p>
                                            <p className={`text-xs truncate ${textMuted}`}>{activity.description}</p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <Clock className={`h-3 w-3 ${textMuted}`} />
                                            <span className={`text-xs whitespace-nowrap ${textMuted}`}>
                                                {formatTimeAgo(activity.timestamp)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {filteredActivities.length > 4 && (
                        <div className={`px-6 py-4 border-t ${isDark ? 'border-dark-700/50' : 'border-gray-200'}`}>
                            <button
                                type="button"
                                onClick={() => setShowAllActivities((prev) => !prev)}
                                className="text-sm font-medium text-primary-500 hover:text-primary-400 transition-colors"
                            >
                                {showAllActivities
                                    ? 'Show less'
                                    : `Show more (${filteredActivities.length - 4} more)`}
                            </button>
                        </div>
                    )}
                </div>

                {showClearConfirm && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className={`w-full max-w-sm rounded-2xl border p-5 shadow-2xl ${isDark ? 'bg-[#0F172A] border-[#334155]' : 'bg-white border-[#CBD5E1]'}`}>
                            <h3 className={`text-lg font-semibold mb-2 ${textPrimary}`}>Clear Activity Log?</h3>
                            <p className={`text-sm mb-5 ${textMuted}`}>
                                This will remove all activity history. This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowClearConfirm(false)}
                                    className="btn-secondary flex-1 justify-center"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        activityService.clear();
                                        setActivities([]);
                                        setShowClearConfirm(false);
                                    }}
                                    className="flex-1 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
