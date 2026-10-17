import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast';
import { AuthProvider, useAuth } from './lib/auth';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import Analyzer from './pages/Analyzer';
import Templates from './pages/Templates';
import Tracker from './pages/Tracker';
import Login from './pages/Login';

// Online mode needs an account for personal data; offline mode (no API
// configured) keeps every page reachable, backed by localStorage.
function Protected({ children }) {
  const { online, loading, user } = useAuth();
  if (!online) return children;
  if (loading) return <div className="grid min-h-screen place-items-center text-sm text-muted">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/editor" element={<Protected><Editor /></Protected>} />
            <Route path="/analyzer" element={<Protected><Analyzer /></Protected>} />
            <Route path="/tracker" element={<Protected><Tracker /></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
