import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import PageTransition from './components/PageTransition';
import MobileBottomNav from './components/MobileBottomNav';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import { Loader2 } from 'lucide-react';

// Lazy-loaded pages for code splitting
const Home = lazy(() => import('./pages/Home'));
const Features = lazy(() => import('./pages/Features'));
const HowItWorks = lazy(() => import('./pages/HowItWorks'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
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

// Inner app component that has access to router context
function AppContent() {
    const navigate = useNavigate();
    const { toggleTheme } = useTheme();

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
                <PageTransition>
                    <Suspense fallback={<PageLoader />}>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/features" element={<Features />} />
                            <Route path="/how-it-works" element={<HowItWorks />} />
                            <Route
                                path="/dashboard"
                                element={
                                    <ProtectedRoute>
                                        <Dashboard />
                                    </ProtectedRoute>
                                }
                            />
                            <Route path="/about" element={<About />} />
                            <Route path="/contact" element={<Contact />} />
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
            <Footer />
            <MobileBottomNav />
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
            <AuthProvider>
                <Router>
                    <ToastProvider>
                        <AppContent />
                    </ToastProvider>
                </Router>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
