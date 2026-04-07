import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Upload,
    File as FileIcon,
    Download,
    Trash2,
    Search,
    Shield,
    AlertTriangle,
    ShieldAlert,
    ShieldCheck,
    Loader2,
    Link as LinkIcon,
    Users,
    Crown,
    ArrowLeft,
    UserMinus,
    FolderLock,
    Copy,
    Check,
    Mail,
    UserPlus,
    XCircle
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { communityService, Community, CommunityMember, CommunityFile, CommunityInvite, CommunityJoinRequest } from '../services/communityService';
import { generateShareToken } from '../utils/crypto';
import { canShareFile, canDownloadFile, canManageCommunity } from '../services/authorizationService';
import UploadModal from '../components/UploadModal';
import ShareModal from '../components/ShareModal';

export default function CommunityVault() {
    const { communityId } = useParams<{ communityId: string }>();
    const navigate = useNavigate();
    const { theme } = useTheme();
    const { user } = useAuth();
    const { addToast } = useToast();
    const isDark = theme === 'dark';
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State
    const [community, setCommunity] = useState<Community | null>(null);
    const [members, setMembers] = useState<CommunityMember[]>([]);
    const [files, setFiles] = useState<CommunityFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [dragActive, setDragActive] = useState(false);

    // Upload state
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);

    // Share modal
    const [showShareModal, setShowShareModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState<CommunityFile | null>(null);

    // Security warning
    const [showSecurityWarning, setShowSecurityWarning] = useState(false);
    const [fileToDownload, setFileToDownload] = useState<CommunityFile | null>(null);

    // Leave community
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteLinkCopied, setInviteLinkCopied] = useState(false);
    const [activeInvite, setActiveInvite] = useState<CommunityInvite | null>(null);
    const [joinRequests, setJoinRequests] = useState<CommunityJoinRequest[]>([]);

    const textPrimary = isDark ? 'text-white' : 'text-[#0F172A]';
    const textMuted = isDark ? 'text-dark-400' : 'text-[#64748B]';

    const loadData = async () => {
        if (!communityId) return;
        setLoading(true);

        const [communityData, membersData, filesData, inviteData, joinRequestsData] = await Promise.all([
            communityService.getCommunityById(communityId),
            communityService.getCommunityMembers(communityId),
            communityService.getCommunityFiles(communityId),
            communityService.getLatestActiveInviteForCommunity(communityId),
            communityService.getCommunityJoinRequests(communityId)
        ]);

        if (communityData.data) setCommunity(communityData.data);
        if (membersData.data) setMembers(membersData.data);
        if (filesData.data) setFiles(filesData.data);
        setActiveInvite(inviteData.data || null);
        if (joinRequestsData.data) setJoinRequests(joinRequestsData.data);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [communityId]);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            simulateFileUpload(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            simulateFileUpload(e.target.files[0]);
        }
    };

    const simulateFileUpload = (file: File) => {
        setIsScanning(true);
        setScanProgress(0);

        const interval = setInterval(() => {
            setScanProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 10;
            });
        }, 200);

        setTimeout(async () => {
            clearInterval(interval);
            setIsScanning(false);
            setPendingFile(file);
            setShowUploadModal(true);
        }, 2500);
    };

    const handleUploadComplete = async (uploadData: {
        file: File;
        hash: string;
        pin: string;
        pinHash: string;
        expiryDuration: string;
        expiryDate: Date;
    }) => {
        if (!communityId) return;

        const { file, hash, pinHash, expiryDate } = uploadData;

        // Generate random malicious score logic for demo
        let score = Math.floor(Math.random() * 10);
        if (file.name.toLowerCase().includes('malicious') || file.name.toLowerCase().includes('virus')) {
            score = 85 + Math.floor(Math.random() * 15);
        } else if (Math.random() > 0.8) {
            score = Math.floor(Math.random() * 100);
        }

        let status: 'safe' | 'warning' | 'danger' = 'safe';
        if (score > 75) status = 'danger';
        else if (score > 30) status = 'warning';

        const shareToken = generateShareToken();
        const shareUrl = `${window.location.origin}/share/${shareToken}`;
        const fileSize = (file.size / (1024 * 1024)).toFixed(1) + ' MB';

        const { data: newFile, error } = await communityService.uploadCommunityFile(
            communityId,
            {
                file_name: file.name,
                file_size: fileSize,
                file_hash: hash,
                pin_hash: pinHash,
                share_token: shareToken,
                share_url: shareUrl,
                expiry_date: expiryDate,
                malicious_score: score,
                security_status: status
            },
            user?.email || 'demo@cybervault.com'
        );

        if (!error && newFile) {
            setFiles(prev => [newFile, ...prev]);
        }

        setPendingFile(null);
    };

    const handleShare = (file: CommunityFile) => {
        const authCheck = canShareFile(user);
        if (!authCheck.authorized) {
            addToast({ type: 'error', title: 'Authorization Required', message: authCheck.message });
            navigate('/login', { state: { action: 'share', fileName: file.file_name } });
            return;
        }
        setSelectedFile(file);
        setShowShareModal(true);
        addToast({ type: 'info', title: 'Share Link', message: `Sharing options for ${file.file_name}` });
    };

    const handleDownloadClick = (file: CommunityFile) => {
        const authCheck = canDownloadFile(user);
        if (!authCheck.authorized) {
            addToast({ type: 'error', title: 'Authorization Required', message: authCheck.message });
            navigate('/login', { state: { action: 'download', fileName: file.file_name } });
            return;
        }
        if (file.malicious_score > 30) {
            setFileToDownload(file);
            setShowSecurityWarning(true);
        } else {
            addToast({ type: 'success', title: 'Download Started', message: `Downloading ${file.file_name}...` });
        }
    };

    const proceedWithUnsafeDownload = () => {
        if (fileToDownload) {
            alert(`Downloading ${fileToDownload.file_name} despite warnings...`);
            setShowSecurityWarning(false);
            setFileToDownload(null);
        }
    };

    const handleDeleteFile = async (fileId: string) => {
        const authCheck = canManageCommunity(user, community?.creator_id);
        if (!authCheck.authorized) {
            addToast({ type: 'error', title: 'Authorization Required', message: authCheck.message });
            return;
        }
        if (confirm('Are you sure you want to delete this file?')) {
            const { success } = await communityService.deleteCommunityFile(fileId);
            if (success) {
                setFiles(prev => prev.filter(f => f.id !== fileId));
                addToast({ type: 'success', title: 'File Deleted', message: 'File has been removed from the community' });
            } else {
                addToast({ type: 'error', title: 'Deletion Failed', message: 'Could not delete the file' });
            }
        }
    };

    const handleLeaveCommunity = async () => {
        if (!user) {
            addToast({ type: 'error', title: 'Authentication Required', message: 'Please login to leave a community' });
            return;
        }
        if (!communityId) return;
        setLeaving(true);
        const { success } = await communityService.leaveCommunity(communityId);
        setLeaving(false);
        if (success) {
            addToast({ type: 'info', title: 'Left Community', message: 'You have left this community' });
            navigate('/communities');
        } else {
            addToast({ type: 'error', title: 'Failed to Leave', message: 'Could not leave the community' });
        }
    };

    const filteredFiles = files.filter(file =>
        file.file_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getSecurityColor = (score: number) => {
        if (score > 75) return 'text-red-500 bg-red-500/10 border-red-500/20';
        if (score > 30) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
        return 'text-green-500 bg-green-500/10 border-green-500/20';
    };

    const getSecurityIcon = (status: CommunityFile['security_status']) => {
        switch (status) {
            case 'danger': return <ShieldAlert className="h-4 w-4" />;
            case 'warning': return <AlertTriangle className="h-4 w-4" />;
            default: return <ShieldCheck className="h-4 w-4" />;
        }
    };

    const isAdmin = user ? community?.creator_id === user.id : false;
    const pendingJoinRequests = joinRequests.filter((request) => request.status === 'pending');

    const buildInviteLink = (token: string) =>
        `${window.location.origin}/communities?inviteToken=${encodeURIComponent(token)}`;

    const ensureActiveInvite = async (invitedEmail?: string): Promise<CommunityInvite | null> => {
        if (!community) return null;

        const now = Date.now();
        if (activeInvite && activeInvite.is_active && new Date(activeInvite.expires_at).getTime() > now) {
            return activeInvite;
        }

        const { data, error } = await communityService.createCommunityInvite(community.id, {
            invitedEmail,
            expiresInHours: 72
        });

        if (error || !data) {
            addToast({
                type: 'error',
                title: 'Invite Creation Failed',
                message: error?.message || 'Could not create a fresh invite link.',
            });
            return null;
        }

        setActiveInvite(data);
        return data;
    };

    const handleCopyInviteLink = async () => {
        const invite = await ensureActiveInvite();
        if (!invite) return;

        try {
            await navigator.clipboard.writeText(buildInviteLink(invite.token));
            setInviteLinkCopied(true);
            addToast({
                type: 'success',
                title: 'Invite Link Copied',
                message: 'Share this link with users so they can open the join flow directly.',
            });
            setTimeout(() => setInviteLinkCopied(false), 2200);
        } catch {
            addToast({
                type: 'error',
                title: 'Copy Failed',
                message: 'Could not copy the invite link. Please copy it manually.',
            });
        }
    };

    const handleSendInviteEmail = () => {
        if (!community) return;
        const email = inviteEmail.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email) {
            addToast({ type: 'error', title: 'Email Required', message: 'Please enter an email address.' });
            return;
        }

        if (!emailRegex.test(email)) {
            addToast({ type: 'error', title: 'Invalid Email', message: 'Please enter a valid email address.' });
            return;
        }

        const sendInvite = async () => {
            const invite = await ensureActiveInvite(email);
            if (!invite) return;

            const subject = encodeURIComponent(`Invitation to join ${community.name} on CyberVault`);
            const body = encodeURIComponent(
                `Hi,\n\nYou've been invited to join "${community.name}" on CyberVault.\n\nJoin using this secure invite link:\n${buildInviteLink(invite.token)}\n\nIf you don't have the community password, you can use the link to send a join request to the admin.\n\nThanks!`
            );
            window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
            addToast({
                type: 'info',
                title: 'Email Draft Opened',
                message: 'Your email app opened with a pre-filled invite message.',
            });
            setInviteEmail('');
        };

        sendInvite();
    };

    const handleApproveRequest = async (requestId: string) => {
        const { success, error } = await communityService.approveCommunityJoinRequest(requestId);
        if (!success) {
            addToast({
                type: 'error',
                title: 'Approval Failed',
                message: error?.message || 'Could not approve this request.',
            });
            return;
        }

        addToast({
            type: 'success',
            title: 'Request Approved',
            message: 'Member was added to this community.',
        });
        loadData();
    };

    const handleRejectRequest = async (requestId: string) => {
        const { success, error } = await communityService.rejectCommunityJoinRequest(requestId);
        if (!success) {
            addToast({
                type: 'error',
                title: 'Rejection Failed',
                message: error?.message || 'Could not reject this request.',
            });
            return;
        }

        addToast({
            type: 'info',
            title: 'Request Rejected',
            message: 'The join request was rejected.',
        });
        loadData();
    };

    if (loading) {
        return (
            <div className="pt-24 pb-12 px-4 min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
            </div>
        );
    }

    if (!community) {
        return (
            <div className="pt-24 pb-12 px-4 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <FolderLock className={`h-16 w-16 mx-auto mb-4 ${textMuted}`} />
                    <h2 className={`text-xl font-semibold mb-2 ${textPrimary}`}>Community not found</h2>
                    <button onClick={() => navigate('/communities')} className="btn-primary mt-4">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Communities
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
                    <div>
                        <button
                            onClick={() => navigate('/communities')}
                            className={`flex items-center gap-2 mb-4 text-sm font-medium transition-colors ${isDark ? 'text-dark-400 hover:text-dark-200' : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Communities
                        </button>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/25">
                                <FolderLock className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className={`text-2xl font-bold ${textPrimary}`}>{community.name}</h1>
                                    {isAdmin && (
                                        <span className="px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-500 text-xs font-medium flex items-center gap-1">
                                            <Crown className="h-3 w-3" />
                                            Admin
                                        </span>
                                    )}
                                </div>
                                <p className={`${textMuted} mt-1`}>{community.description || 'Secure group vault'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Community Info */}
                    <div className="flex flex-wrap gap-4">
                        <div className="glass-card px-4 py-3 flex items-center gap-3">
                            <Users className="h-5 w-5 text-primary-500" />
                            <div>
                                <p className={`text-xs ${textMuted}`}>Members</p>
                                <p className={`text-lg font-semibold ${textPrimary}`}>{members.length}/{community.max_members}</p>
                            </div>
                        </div>
                        <div className="glass-card px-4 py-3 flex items-center gap-3">
                            <FileIcon className="h-5 w-5 text-green-500" />
                            <div>
                                <p className={`text-xs ${textMuted}`}>Files</p>
                                <p className={`text-lg font-semibold ${textPrimary}`}>{files.length}</p>
                            </div>
                        </div>
                        {!isAdmin && (
                            <button
                                onClick={() => setShowLeaveConfirm(true)}
                                className={`px-4 py-3 rounded-xl flex items-center gap-2 transition-colors ${isDark
                                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                                    }`}
                            >
                                <UserMinus className="h-5 w-5" />
                                Leave
                            </button>
                        )}
                    </div>
                </div>

                {/* Members List */}
                <div className="glass-card p-4 mb-8">
                    <h3 className={`text-sm font-medium mb-3 ${textMuted}`}>Members</h3>
                    <div className="flex flex-wrap gap-2">
                        {members.map((member) => (
                            <div
                                key={member.id}
                                className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-2 ${isDark ? 'bg-dark-700' : 'bg-[#E4F3EC]'
                                    }`}
                            >
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${member.role === 'admin'
                                    ? 'bg-primary-500 text-white'
                                    : isDark ? 'bg-dark-600 text-gray-300' : 'bg-gray-300 text-gray-700'
                                    }`}>
                                    {member.user_email.charAt(0).toUpperCase()}
                                </div>
                                <span className={textPrimary}>{member.user_email}</span>
                                {member.role === 'admin' && (
                                    <Crown className="h-3 w-3 text-primary-500" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Add Members (Admin) */}
                {isAdmin && (
                    <div className="glass-card p-4 sm:p-5 mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <UserPlus className="h-5 w-5 text-primary-500" />
                            <h3 className={`text-base font-semibold ${textPrimary}`}>Add Members</h3>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className={`rounded-xl border p-4 ${isDark ? 'border-[#334155] bg-[#1E293B]/50' : 'border-[#CBD5E1] bg-[#F9FEFC]'}`}>
                                <p className={`text-sm font-medium mb-2 ${textPrimary}`}>Invite Link</p>
                                <p className={`text-xs mb-3 ${textMuted}`}>
                                    Share this expiring link so users can join directly or send a join request.
                                </p>
                                <div className={`text-xs rounded-lg px-3 py-2 mb-3 break-all ${isDark ? 'bg-dark-800 text-dark-300' : 'bg-[#E4F3EC] text-[#334155]'}`}>
                                    {activeInvite
                                        ? buildInviteLink(activeInvite.token)
                                        : 'No active invite yet. Click copy to generate one.'}
                                </div>
                                {activeInvite && (
                                    <p className={`text-[11px] mb-3 ${textMuted}`}>
                                        Expires: {new Date(activeInvite.expires_at).toLocaleString()}
                                    </p>
                                )}
                                <button
                                    type="button"
                                    onClick={handleCopyInviteLink}
                                    className="btn-secondary w-full justify-center"
                                >
                                    {inviteLinkCopied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                                    {inviteLinkCopied ? 'Copied' : 'Copy Invite Link'}
                                </button>
                            </div>

                            <div className={`rounded-xl border p-4 ${isDark ? 'border-[#334155] bg-[#1E293B]/50' : 'border-[#CBD5E1] bg-[#F9FEFC]'}`}>
                                <p className={`text-sm font-medium mb-2 ${textPrimary}`}>Invite by Email</p>
                                <p className={`text-xs mb-3 ${textMuted}`}>
                                    Enter an email address and open a pre-filled invite request.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        placeholder="friend@example.com"
                                        className="input-field py-2.5"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSendInviteEmail}
                                        className="btn-primary whitespace-nowrap"
                                    >
                                        <Mail className="h-4 w-4 mr-2" />
                                        Send Invite
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className={`rounded-xl border p-4 mt-4 ${isDark ? 'border-[#334155] bg-[#1E293B]/50' : 'border-[#CBD5E1] bg-[#F9FEFC]'}`}>
                            <div className="flex items-center justify-between gap-2 mb-3">
                                <p className={`text-sm font-medium ${textPrimary}`}>Pending Join Requests</p>
                                <span className="px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-500 text-xs font-semibold">
                                    {pendingJoinRequests.length}
                                </span>
                            </div>

                            {pendingJoinRequests.length === 0 ? (
                                <p className={`text-xs ${textMuted}`}>No pending requests right now.</p>
                            ) : (
                                <div className="space-y-2">
                                    {pendingJoinRequests.map((request) => (
                                        <div
                                            key={request.id}
                                            className={`rounded-lg p-3 border ${isDark ? 'border-[#334155] bg-dark-800/40' : 'border-[#CBD5E1] bg-white'}`}
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                <div>
                                                    <p className={`text-sm font-medium ${textPrimary}`}>{request.requester_email}</p>
                                                    <p className={`text-xs ${textMuted}`}>
                                                        Requested on {new Date(request.created_at).toLocaleString()}
                                                    </p>
                                                    {request.message && (
                                                        <p className={`text-xs mt-1 ${textMuted}`}>Message: {request.message}</p>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleApproveRequest(request.id)}
                                                        className="px-3 py-1.5 rounded-lg bg-green-500/15 text-green-500 hover:bg-green-500/25 text-xs font-medium flex items-center gap-1"
                                                    >
                                                        <Check className="h-3.5 w-3.5" />
                                                        Approve
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRejectRequest(request.id)}
                                                        className="px-3 py-1.5 rounded-lg bg-red-500/15 text-red-500 hover:bg-red-500/25 text-xs font-medium flex items-center gap-1"
                                                    >
                                                        <XCircle className="h-3.5 w-3.5" />
                                                        Reject
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Upload Section */}
                <div
                    className={`glass-card p-8 mb-8 border-2 border-dashed transition-all relative overflow-hidden ${dragActive
                        ? 'border-primary-500 bg-primary-500/10'
                        : isDark
                            ? 'border-dark-600 hover:border-primary-500/50'
                            : 'border-gray-300 hover:border-primary-500/50'
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    {isScanning ? (
                        <div className="text-center py-4">
                            <Loader2 className="h-12 w-12 text-primary-500 animate-spin mx-auto mb-4" />
                            <h3 className={`text-lg font-semibold mb-2 ${textPrimary}`}>
                                Scanning File for Threats...
                            </h3>
                            <p className={`${textMuted} mb-4`}>
                                Analyzing file integrity and checking for malicious signatures.
                            </p>
                            <div className="max-w-md mx-auto h-2 bg-gray-700/50 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary-500 transition-all duration-300"
                                    style={{ width: `${scanProgress}%` }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-500/20 mb-4">
                                <Upload className="h-8 w-8 text-primary-500" />
                            </div>
                            <h3 className={`text-lg font-semibold mb-2 ${textPrimary}`}>
                                Upload to Community Vault
                            </h3>
                            <p className={`${textMuted} mb-4`}>
                                Share files securely with your group members
                            </p>
                            <label className="btn-primary cursor-pointer inline-flex">
                                <Upload className="h-4 w-4 mr-2" />
                                Select Files
                                <input
                                    type="file"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                />
                            </label>
                            <p className={`text-xs mt-4 ${textMuted}`}>
                                Automatic virus scanning enabled • AES-256 Encryption
                            </p>
                        </div>
                    )}
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 ${textMuted}`} />
                    <input
                        type="text"
                        placeholder="Search files..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-field pl-12"
                    />
                </div>

                {/* Files List */}
                <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className={`border-b ${isDark ? 'border-[#334155]' : 'border-[#CBD5E1]'}`}>
                                    <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${textMuted}`}>
                                        File Name
                                    </th>
                                    <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${textMuted}`}>
                                        Uploaded By
                                    </th>
                                    <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${textMuted}`}>
                                        Size
                                    </th>
                                    <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${textMuted}`}>
                                        Security Scan
                                    </th>
                                    <th className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${textMuted}`}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isDark ? 'divide-dark-700' : 'divide-gray-200'}`}>
                                {filteredFiles.map((file) => (
                                    <tr key={file.id} className={`transition-colors ${isDark ? 'hover:bg-dark-800/50' : 'hover:bg-[#E4F3EC]'}`}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                                                    <FileIcon className="h-5 w-5 text-primary-500" />
                                                </div>
                                                <div>
                                                    <p className={`font-medium ${textPrimary}`}>{file.file_name}</p>
                                                    <p className={`text-xs ${textMuted}`}>
                                                        {new Date(file.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap ${textMuted}`}>
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center text-xs text-primary-500 font-medium">
                                                    {file.uploader_email.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-sm">{file.uploader_email}</span>
                                            </div>
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap ${textMuted}`}>
                                            {file.file_size}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col gap-1">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium w-fit ${getSecurityColor(file.malicious_score)}`}>
                                                    {getSecurityIcon(file.security_status)}
                                                    {file.security_status === 'safe' ? 'Safe' : file.security_status === 'warning' ? 'Suspicious' : 'Malicious'}
                                                </span>
                                                <span className="text-[10px] text-gray-500 ml-1">
                                                    Threat Level: {file.malicious_score}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleShare(file)}
                                                    className={`p-2 rounded-lg transition-colors ${isDark
                                                        ? 'text-gray-400 hover:text-primary-400 hover:bg-[#334155]'
                                                        : 'text-gray-400 hover:text-primary-600 hover:bg-[#E4F3EC]'
                                                        }`}
                                                    title="Share"
                                                >
                                                    <LinkIcon className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDownloadClick(file)}
                                                    className={`p-2 rounded-lg transition-colors ${isDark
                                                        ? 'text-dark-400 hover:text-dark-200 hover:bg-[#334155]'
                                                        : 'text-gray-400 hover:text-gray-900 hover:bg-[#E4F3EC]'
                                                        }`}
                                                    title="Download"
                                                >
                                                    <Download className="h-5 w-5" />
                                                </button>
                                                {(isAdmin || file.uploader_id === (user?.id || 'demo-user')) && (
                                                    <button
                                                        onClick={() => handleDeleteFile(file.id)}
                                                        className={`p-2 rounded-lg transition-colors ${isDark
                                                            ? 'text-gray-400 hover:text-red-400 hover:bg-[#334155]'
                                                            : 'text-gray-400 hover:text-red-500 hover:bg-[#E4F3EC]'
                                                            }`}
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredFiles.length === 0 && (
                        <div className="text-center py-12">
                            <Shield className={`h-12 w-12 mx-auto mb-4 ${textMuted}`} />
                            <p className={textMuted}>No files in this vault yet</p>
                            <p className={`text-sm ${textMuted}`}>Upload your first file</p>
                        </div>
                    )}
                </div>

                {/* Leave Confirmation Modal */}
                {showLeaveConfirm && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                        <div className={`p-6 max-w-sm w-full animate-slide-up rounded-2xl shadow-2xl border ${isDark ? 'bg-dark-900 border-[#334155]' : 'bg-[#F9FEFC] border-[#CBD5E1]'
                            }`}>
                            <div className="text-center mb-6">
                                <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                                    <UserMinus className="h-7 w-7 text-red-500" />
                                </div>
                                <h3 className={`text-xl font-bold mb-2 ${textPrimary}`}>Leave Community?</h3>
                                <p className={textMuted}>
                                    You won't be able to access files in this vault anymore.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowLeaveConfirm(false)}
                                    className="btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleLeaveCommunity}
                                    disabled={leaving}
                                    className="flex-1 py-3 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors flex items-center justify-center"
                                >
                                    {leaving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Leave'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Security Warning Modal */}
                {showSecurityWarning && fileToDownload && (
                    <div className="fixed inset-0 bg-red-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                        <div className={`p-6 max-w-md w-full animate-slide-up rounded-2xl shadow-2xl border-2 border-red-500/50 ${isDark ? 'bg-[#0F172A]' : 'bg-[#F9FEFC]'
                            }`}>
                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4 animate-pulse">
                                    <ShieldAlert className="h-8 w-8 text-red-500" />
                                </div>
                                <h3 className={`text-xl font-bold mb-2 ${textPrimary}`}>
                                    Malicious File Detected!
                                </h3>
                                <p className={`text-sm ${textMuted}`}>
                                    The file <span className="font-bold text-red-500">{fileToDownload.file_name}</span> has a high threat score.
                                </p>
                            </div>

                            <div className={`p-4 rounded-xl mb-6 text-sm ${isDark ? 'bg-red-500/10 text-red-200' : 'bg-red-50 text-red-800'
                                }`}>
                                <p className="font-semibold mb-1 flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    Security Warning
                                </p>
                                <p>
                                    Our scanning engine detected potential malware. Proceed with caution.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => setShowSecurityWarning(false)}
                                    className="btn-primary w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 border-none"
                                >
                                    Cancel (Recommended)
                                </button>
                                <button
                                    onClick={proceedWithUnsafeDownload}
                                    className={`w-full py-3 text-sm font-medium rounded-xl transition-colors ${isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'
                                        }`}
                                >
                                    I understand the risks, download anyway
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Upload Modal */}
                <UploadModal
                    isOpen={showUploadModal}
                    onClose={() => {
                        setShowUploadModal(false);
                        setPendingFile(null);
                    }}
                    file={pendingFile}
                    onUploadComplete={handleUploadComplete}
                />

                {/* Share Modal */}
                <ShareModal
                    isOpen={showShareModal}
                    onClose={() => setShowShareModal(false)}
                    file={selectedFile ? {
                        id: selectedFile.id,
                        name: selectedFile.file_name,
                        hash: selectedFile.file_hash,
                        expiryDate: new Date(selectedFile.expiry_date),
                        hasPin: true
                    } : null}
                />
            </div>
        </div>
    );
}
