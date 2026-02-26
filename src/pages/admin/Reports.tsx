import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileDown, Shield, Lock, Loader2, Database, Users, Download, Calendar, AlertTriangle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { fileService, SharedFileRecord } from '../../services/fileService';

// IMPORTANT: This is a client-side check only. Server-side enforcement via
// Supabase RLS policies is the real security boundary. This just controls UI visibility.
// Set VITE_ADMIN_EMAIL in your .env file to configure the admin user.
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || '';

export default function AdminReports() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const navigate = useNavigate();
    const isDark = theme === 'dark';

    const [isExporting, setIsExporting] = useState(false);
    const [allFiles, setAllFiles] = useState<SharedFileRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<{
        total: number;
        active: number;
        expired: number;
        downloads: number;
    } | null>(null);

    const textPrimary = isDark ? 'text-white' : 'text-gray-900';
    const textMuted = isDark ? 'text-gray-400' : 'text-gray-600';

    // Check if user is admin
    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        // Check admin access - modify this condition as needed
        if (user.email !== ADMIN_EMAIL) {
            navigate('/dashboard');
            return;
        }

        loadData();
    }, [user, navigate]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [filesResult, statsResult] = await Promise.all([
                fileService.getUserFiles(),
                fileService.getFileStats()
            ]);

            if (filesResult.data) {
                setAllFiles(filesResult.data);
            }
            if (statsResult.data) {
                setStats(statsResult.data);
            }
        } catch (error) {
            console.error('Error loading admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle Excel Export
    const handleExportExcel = async () => {
        setIsExporting(true);
        try {
            const { success, error } = await fileService.exportToExcel();
            if (!success || error) {
                alert('Export failed. Please try again.');
            }
        } catch (err) {
            console.error('Export failed:', err);
            alert('Failed to export files. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    if (!user || user.email !== ADMIN_EMAIL) {
        return (
            <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h1 className={`text-2xl font-bold ${textPrimary}`}>Access Denied</h1>
                    <p className={textMuted}>You don't have permission to access this page.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 text-primary-500 animate-spin mx-auto mb-4" />
                    <p className={textMuted}>Loading admin data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Admin Header */}
                <div className="glass-card p-6 mb-8 border-l-4 border-red-500">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                            <Shield className="h-5 w-5 text-red-500" />
                        </div>
                        <div>
                            <h1 className={`text-2xl font-bold ${textPrimary}`}>Admin Reports</h1>
                            <p className={`text-sm ${textMuted}`}>
                                Secure file reports - Admin access only
                            </p>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-sm">
                        <Lock className="h-4 w-4 text-red-400" />
                        <span className={textMuted}>Logged in as: {user?.email}</span>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="glass-card p-4">
                        <div className="flex items-center gap-3">
                            <Database className="h-8 w-8 text-primary-500" />
                            <div>
                                <p className={`text-sm ${textMuted}`}>Total Files</p>
                                <p className={`text-2xl font-bold ${textPrimary}`}>{stats?.total || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-card p-4">
                        <div className="flex items-center gap-3">
                            <Shield className="h-8 w-8 text-green-500" />
                            <div>
                                <p className={`text-sm ${textMuted}`}>Active Files</p>
                                <p className={`text-2xl font-bold ${textPrimary}`}>{stats?.active || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-card p-4">
                        <div className="flex items-center gap-3">
                            <Calendar className="h-8 w-8 text-yellow-500" />
                            <div>
                                <p className={`text-sm ${textMuted}`}>Expired Files</p>
                                <p className={`text-2xl font-bold ${textPrimary}`}>{stats?.expired || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-card p-4">
                        <div className="flex items-center gap-3">
                            <Download className="h-8 w-8 text-cyan-500" />
                            <div>
                                <p className={`text-sm ${textMuted}`}>Total Downloads</p>
                                <p className={`text-2xl font-bold ${textPrimary}`}>{stats?.downloads || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Export Section */}
                <div className="glass-card p-6 mb-8">
                    <h2 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Export Reports</h2>
                    <p className={`${textMuted} mb-6`}>
                        Download a complete Excel report of all file records with formatting:
                        <br />• <strong>Sr. No.</strong> column at the beginning
                        <br />• <strong>Bold headers</strong> for all columns
                        <br />• <strong>Centered content</strong> in all cells
                    </p>
                    <button
                        onClick={handleExportExcel}
                        disabled={isExporting || allFiles.length === 0}
                        className="btn-primary disabled:opacity-50 flex items-center gap-2"
                    >
                        {isExporting ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Generating Excel...
                            </>
                        ) : (
                            <>
                                <FileDown className="h-5 w-5" />
                                Export All Files to Excel
                            </>
                        )}
                    </button>
                </div>

                {/* Recent Files Table */}
                <div className="glass-card overflow-hidden">
                    <div className="p-4 border-b border-gray-700/50">
                        <h2 className={`text-lg font-semibold ${textPrimary}`}>
                            Recent File Records ({allFiles.length})
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className={`border-b ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
                                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${textMuted}`}>Sr. No.</th>
                                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${textMuted}`}>File Name</th>
                                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${textMuted}`}>Size</th>
                                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${textMuted}`}>Status</th>
                                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${textMuted}`}>Downloads</th>
                                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${textMuted}`}>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allFiles.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center">
                                            <Users className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                                            <p className={textMuted}>No file records found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    allFiles.map((file, index) => (
                                        <tr
                                            key={file.id}
                                            className={`border-b ${isDark ? 'border-dark-700/50' : 'border-gray-100'} hover:bg-primary-500/5`}
                                        >
                                            <td className={`px-4 py-3 ${textMuted}`}>{index + 1}</td>
                                            <td className={`px-4 py-3 ${textPrimary} font-medium`}>{file.file_name}</td>
                                            <td className={`px-4 py-3 ${textMuted}`}>{file.file_size}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${file.security_status === 'safe'
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : file.security_status === 'warning'
                                                        ? 'bg-yellow-500/20 text-yellow-400'
                                                        : 'bg-red-500/20 text-red-400'
                                                    }`}>
                                                    {file.security_status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className={`px-4 py-3 ${textMuted}`}>{file.download_count}</td>
                                            <td className={`px-4 py-3 ${textMuted}`}>
                                                {new Date(file.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
