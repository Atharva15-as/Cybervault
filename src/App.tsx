import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import PageTransition from './components/PageTransition';
import MobileBottomNav from './components/MobileBottomNav';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import ScrollToTop from './components/ScrollToTop';
import { isSupabaseConfigured, supabaseConfigErrorMessage } from './lib/supabase';
import { Loader2 } from 'lucide-react';

// Lazy-loaded pages for code splitting
const Home = lazy(() => import('./pages/Home'));
const Features = lazy(() => import('./pages/Features'));
const HowItWorks = lazy(() => import('./pages/HowItWorks'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const SharedFile = lazy(() => import('./pages/SharedFile'));
const AdminReports = lazy(() => import('./pages/admin/Reports'));
const Communities = lazy(() => import('./pages/Communities'));
const CommunityVault = lazy(() => import('./pages/CommunityVault'));
const ScannerHome = lazy(() => import('./scanner/pages/ScannerHome'));
const FileScanner = lazy(() => import('./scanner/pages/FileScanner'));
const UrlScanner = lazy(() => import('./scanner/pages/UrlScanner'));
const ScanHistory = lazy(() => import('./scanner/pages/ScanHistory'));
const ActivityLog = lazy(() => import('./pages/ActivityLog'));
const Converter = lazy(() => import('./pages/Converter'));
const SecureEncrypt = lazy(() => import('./pages/SecureEncrypt'));
const FileEncryptDecrypt = lazy(() => import('./pages/FileEncryptDecrypt'));
const SiemTool = lazy(() => import('./pages/SiemTool'));

// Loading fallback
function PageLoader() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center">
                <Loader2 className={`h-8 w-8 animate-spin mx-auto mb-3 text-primary-500`} />
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Loading...</p>
            </div>
        </div>
    );
}

function ConfigErrorScreen() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className={`min-h-screen flex items-center justify-center px-4 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
            <div className={`w-full max-w-2xl rounded-2xl border p-6 sm:p-8 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                <h1 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Configuration Required</h1>
                <p className={`text-sm sm:text-base mb-5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    This deployment is missing required Supabase environment variables, so authentication cannot start yet.
                </p>
                <div className={`rounded-lg p-4 mb-5 font-mono text-xs sm:text-sm break-all ${isDark ? 'bg-gray-950 text-red-300 border border-gray-800' : 'bg-gray-100 text-red-700 border border-gray-200'}`}>
                    {supabaseConfigErrorMessage}
                </div>
                <ol className={`list-decimal pl-5 space-y-2 text-sm sm:text-base ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <li>Go to Vercel Project Settings and open Environment Variables.</li>
                    <li>Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for Production.</li>
                    <li>Redeploy the app, then refresh this page.</li>
                </ol>
            </div>
        </div>
    );
}

// Inner app component that has access to router context
function AppContent() {
    const navigate = useNavigate();
    const location = useLocation();
    const { toggleTheme } = useTheme();

    const isAuthPage = ['/login', '/register', '/forgot-password'].includes(location.pathname);

    return (
        <div className="site-shell min-h-screen flex flex-col">
            <ScrollToTop />
            <div className="global-bg-animation" aria-hidden="true" />
            <Navbar />
            <main className="flex-1 relative z-10">
                <PageTransition>
                    <Suspense fallback={<PageLoader />}>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/features" element={<Features />} />
                            <Route path="/how-it-works" element={<HowItWorks />} />
                            <Route path="/privacy" element={<PrivacyPolicy />} />
                            <Route path="/terms" element={<TermsAndConditions />} />
                            <Route
                                path="/dashboard"
                                element={
                                    <ProtectedRoute>
                                        <Dashboard />
                                    </ProtectedRoute>
                                }
                            />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            <Route path="/share/:token" element={<SharedFile />} />
                            {/* Admin Routes - Protected */}
                            <Route
                                path="/admin/reports"
                                element={
                                    <ProtectedRoute>
                                        <AdminReports />
                                    </ProtectedRoute>
                                }
                            />
                            {/* Community Routes - Protected */}
                            <Route
                                path="/communities"
                                element={
                                    <ProtectedRoute>
                                        <Communities />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/community/:communityId"
                                element={
                                    <ProtectedRoute>
                                        <CommunityVault />
                                    </ProtectedRoute>
                                }
                            />
                            {/* Activity Log - Protected */}
                            <Route
                                path="/activity"
                                element={
                                    <ProtectedRoute>
                                        <ActivityLog />
                                    </ProtectedRoute>
                                }
                            />
                            {/* Scanner Routes - Public */}
                            <Route path="/scanner" element={<ScannerHome />} />
                            <Route path="/converter" element={<Converter />} />
                            <Route path="/encrypt" element={<SecureEncrypt />} />
                            <Route path="/file-encrypt-decrypt" element={<FileEncryptDecrypt />} />
                            <Route
                                path="/siem"
                                element={
                                    <ProtectedRoute>
                                        <SiemTool />
                                    </ProtectedRoute>
                                }
                            />
                            <Route path="/scanner/file" element={<FileScanner />} />
                            <Route path="/scanner/url" element={<UrlScanner />} />
                            <Route
                                path="/scanner/history"
                                element={
                                    <ProtectedRoute>
                                        <ScanHistory />
                                    </ProtectedRoute>
                                }
                            />
                        </Routes>
                    </Suspense>
                </PageTransition>
            </main>
            {!isAuthPage && <div className="relative z-10"><Footer /></div>}
            <div className="relative z-10"><MobileBottomNav /></div>
            <KeyboardShortcuts
                onNavigate={(path) => navigate(path)}
                onToggleTheme={toggleTheme}
            />
        </div>
    );
}

function App() {
    return (
        <ThemeProvider>
            {isSupabaseConfigured ? (
                <AuthProvider>
                    <Router>
                        <ToastProvider>
                            <AppContent />
                        </ToastProvider>
                    </Router>
                </AuthProvider>
            ) : (
                <ConfigErrorScreen />
            )}
        </ThemeProvider>
    );
}

export default App;
