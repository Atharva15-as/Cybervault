import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    Plus,
    Lock,
    Search,
    UserPlus,
    Shield,
    Crown,
    ChevronRight,
    Loader2,
    X,
    Eye,
    EyeOff,
    FolderLock,
    Sparkles
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { communityService, Community } from '../services/communityService';

// Create Community Modal Component
function CreateCommunityModal({
    isOpen,
    onClose,
    onCreated
}: {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
}) {
    const { theme } = useTheme();
    const { user } = useAuth();
    const isDark = theme === 'dark';

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [maxMembers, setMaxMembers] = useState(10);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCreate = async () => {
        if (!name.trim()) {
            setError('Community name is required');
            return;
        }
        if (password.length < 4) {
            setError('Password must be at least 4 characters');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError('');

        const { data, error: createError } = await communityService.createCommunity({
            name: name.trim(),
            description: description.trim(),
            password,
            max_members: maxMembers
        }, user?.email || 'demo@cybervault.com');

        setLoading(false);

        if (createError) {
            setError(createError.message);
            return;
        }

        if (data) {
            onCreated();
            onClose();
            setName('');
            setDescription('');
            setPassword('');
            setConfirmPassword('');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className={`p-6 max-w-md w-full animate-slide-up rounded-2xl shadow-2xl border ${isDark ? 'bg-dark-900 border-dark-700' : 'bg-white border-gray-200'
                }`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center">
                            <Users className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Create Community
                            </h3>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                Set up a secure vault for your group
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-dark-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                            }`}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <div className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Community Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Project Alpha Team"
                            className="input-field"
                            maxLength={50}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What's this community for?"
                            className="input-field resize-none h-20"
                            maxLength={200}
                        />
                    </div>

                    {/* Max Members */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Maximum Members
                        </label>
                        <select
                            value={maxMembers}
                            onChange={(e) => setMaxMembers(Number(e.target.value))}
                            className="input-field"
                        >
                            <option value={4}>4 members</option>
                            <option value={6}>6 members</option>
                            <option value={10}>10 members</option>
                            <option value={20}>20 members</option>
                            <option value={50}>50 members</option>
                        </select>
                    </div>

                    {/* Password */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Access Password *
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Min 4 characters"
                                className="input-field pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-400' : 'text-gray-500'
                                    }`}
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Confirm Password *
                        </label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter password"
                            className="input-field"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Info */}
                    <div className={`p-3 rounded-lg text-sm ${isDark ? 'bg-primary-500/10 text-primary-300' : 'bg-primary-50 text-primary-700'
                        }`}>
                        <p className="flex items-start gap-2">
                            <Lock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            Share the password with your friends to let them join and access shared files.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="btn-secondary flex-1"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={loading}
                            className="btn-primary flex-1"
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    <Plus className="h-5 w-5 mr-2" />
                                    Create
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Join Community Modal Component
function JoinCommunityModal({
    isOpen,
    onClose,
    community,
    onJoined
}: {
    isOpen: boolean;
    onClose: () => void;
    community: Community | null;
    onJoined: () => void;
}) {
    const { theme } = useTheme();
    const { user } = useAuth();
    const isDark = theme === 'dark';

    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleJoin = async () => {
        if (!community) return;
        if (!password) {
            setError('Password is required');
            return;
        }

        setLoading(true);
        setError('');

        const { success, error: joinError } = await communityService.joinCommunity(
            community.id,
            password,
            user?.email || 'demo@cybervault.com'
        );

        setLoading(false);

        if (joinError) {
            setError(joinError.message);
            return;
        }

        if (success) {
            onJoined();
            onClose();
            setPassword('');
        }
    };

    if (!isOpen || !community) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className={`p-6 max-w-md w-full animate-slide-up rounded-2xl shadow-2xl border ${isDark ? 'bg-dark-900 border-dark-700' : 'bg-white border-gray-200'
                }`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                            <UserPlus className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Join Community
                            </h3>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {community.name}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-dark-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                            }`}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Community Info */}
                <div className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-dark-800' : 'bg-gray-50'
                    }`}>
                    <p className={`text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {community.description || 'No description provided'}
                    </p>
                    <div className={`flex items-center gap-4 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {community.member_count}/{community.max_members} members
                        </span>
                        <span className="flex items-center gap-1">
                            <Crown className="h-3 w-3" />
                            {community.creator_email}
                        </span>
                    </div>
                </div>

                {/* Form */}
                <div className="space-y-4">
                    {/* Password */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Community Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter the access password"
                                className="input-field pr-10"
                                onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-400' : 'text-gray-500'
                                    }`}
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="btn-secondary flex-1"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleJoin}
                            disabled={loading}
                            className="btn-primary flex-1"
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    <UserPlus className="h-5 w-5 mr-2" />
                                    Join
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Main Communities Page
export default function Communities() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const navigate = useNavigate();
    const isDark = theme === 'dark';

    const [myCommunities, setMyCommunities] = useState<Community[]>([]);
    const [allCommunities, setAllCommunities] = useState<Community[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'my' | 'browse'>('my');

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);

    const textPrimary = isDark ? 'text-white' : 'text-gray-900';
    const textMuted = isDark ? 'text-gray-400' : 'text-gray-600';

    const loadCommunities = async () => {
        setLoading(true);
        const [myData, allData] = await Promise.all([
            communityService.getUserCommunities(),
            communityService.getAllCommunities()
        ]);

        if (myData.data) setMyCommunities(myData.data);
        if (allData.data) setAllCommunities(allData.data);
        setLoading(false);
    };

    useEffect(() => {
        loadCommunities();
    }, []);

    const handleJoinClick = (community: Community) => {
        setSelectedCommunity(community);
        setShowJoinModal(true);
    };

    const filteredMyCommunities = myCommunities.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredBrowseCommunities = allCommunities
        .filter(c => !myCommunities.some(mc => mc.id === c.id))
        .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center">
                                <Users className="h-5 w-5 text-white" />
                            </div>
                            <h1 className={`text-2xl font-bold ${textPrimary}`}>Communities</h1>
                        </div>
                        <p className={textMuted}>Create or join secure groups to share files with your friends</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn-primary"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Create Community
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('my')}
                        className={`px-4 py-2 rounded-xl font-medium transition-all ${activeTab === 'my'
                            ? 'bg-primary-500 text-white'
                            : isDark
                                ? 'bg-dark-800 text-gray-400 hover:text-white'
                                : 'bg-gray-100 text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        My Communities ({myCommunities.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('browse')}
                        className={`px-4 py-2 rounded-xl font-medium transition-all ${activeTab === 'browse'
                            ? 'bg-primary-500 text-white'
                            : isDark
                                ? 'bg-dark-800 text-gray-400 hover:text-white'
                                : 'bg-gray-100 text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Browse ({filteredBrowseCommunities.length})
                    </button>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 ${textMuted}`} />
                    <input
                        type="text"
                        placeholder="Search communities..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-field pl-12"
                    />
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* My Communities Tab */}
                        {activeTab === 'my' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredMyCommunities.length > 0 ? (
                                    filteredMyCommunities.map((community) => (
                                        <div
                                            key={community.id}
                                            onClick={() => navigate(`/community/${community.id}`)}
                                            className="glass-card p-5 cursor-pointer card-hover group"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center">
                                                    <FolderLock className="h-6 w-6 text-white" />
                                                </div>
                                                <ChevronRight className={`h-5 w-5 transition-transform group-hover:translate-x-1 ${textMuted}`} />
                                            </div>
                                            <h3 className={`font-semibold mb-1 ${textPrimary}`}>{community.name}</h3>
                                            <p className={`text-sm mb-3 line-clamp-2 ${textMuted}`}>
                                                {community.description || 'No description'}
                                            </p>
                                            <div className={`flex items-center gap-3 text-xs ${textMuted}`}>
                                                <span className="flex items-center gap-1">
                                                    <Users className="h-3 w-3" />
                                                    {community.member_count}/{community.max_members}
                                                </span>
                                                {community.creator_id === (user?.id || 'demo-user') && (
                                                    <span className="flex items-center gap-1 text-primary-500">
                                                        <Crown className="h-3 w-3" />
                                                        Admin
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className={`col-span-full text-center py-16 glass-card rounded-2xl`}>
                                        <div className="w-16 h-16 rounded-2xl bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
                                            {searchQuery ? (
                                                <Search className="h-8 w-8 text-primary-500" />
                                            ) : (
                                                <Sparkles className="h-8 w-8 text-primary-500" />
                                            )}
                                        </div>
                                        <h3 className={`text-lg font-semibold mb-2 ${textPrimary}`}>
                                            {searchQuery ? 'No community found' : 'No communities yet'}
                                        </h3>
                                        <p className={`${textMuted} mb-4`}>
                                            {searchQuery
                                                ? `No communities matching "${searchQuery}"`
                                                : 'Create your first community or join an existing one'
                                            }
                                        </p>
                                        {!searchQuery && (
                                            <button
                                                onClick={() => setShowCreateModal(true)}
                                                className="btn-primary"
                                            >
                                                <Plus className="h-5 w-5 mr-2" />
                                                Create Community
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Browse Communities Tab */}
                        {activeTab === 'browse' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredBrowseCommunities.length > 0 ? (
                                    filteredBrowseCommunities.map((community) => (
                                        <div
                                            key={community.id}
                                            className="glass-card p-5"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                                                    <Shield className="h-6 w-6 text-white" />
                                                </div>
                                                {community.member_count < community.max_members ? (
                                                    <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-500 text-xs font-medium">
                                                        Open
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-500 text-xs font-medium">
                                                        Full
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className={`font-semibold mb-1 ${textPrimary}`}>{community.name}</h3>
                                            <p className={`text-sm mb-3 line-clamp-2 ${textMuted}`}>
                                                {community.description || 'No description'}
                                            </p>
                                            <div className={`flex items-center justify-between text-xs ${textMuted}`}>
                                                <span className="flex items-center gap-1">
                                                    <Users className="h-3 w-3" />
                                                    {community.member_count}/{community.max_members} members
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Lock className="h-3 w-3" />
                                                    Password Protected
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleJoinClick(community)}
                                                disabled={community.member_count >= community.max_members}
                                                className={`w-full mt-4 py-2 rounded-xl font-medium transition-all ${community.member_count < community.max_members
                                                    ? 'bg-primary-500 hover:bg-primary-600 text-white'
                                                    : isDark
                                                        ? 'bg-dark-700 text-gray-500 cursor-not-allowed'
                                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                    }`}
                                            >
                                                {community.member_count < community.max_members ? 'Join Community' : 'Community Full'}
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className={`col-span-full text-center py-16 glass-card rounded-2xl`}>
                                        <div className="w-16 h-16 rounded-2xl bg-gray-500/20 flex items-center justify-center mx-auto mb-4">
                                            <Search className="h-8 w-8 text-gray-500" />
                                        </div>
                                        <h3 className={`text-lg font-semibold mb-2 ${textPrimary}`}>
                                            {searchQuery ? 'No community found' : 'No communities to join'}
                                        </h3>
                                        <p className={textMuted}>
                                            {searchQuery
                                                ? `No communities matching "${searchQuery}"`
                                                : 'All available communities are already joined or none exist yet'
                                            }
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modals */}
            <CreateCommunityModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreated={loadCommunities}
            />
            <JoinCommunityModal
                isOpen={showJoinModal}
                onClose={() => setShowJoinModal(false)}
                community={selectedCommunity}
                onJoined={loadCommunities}
            />
        </div>
    );
}
