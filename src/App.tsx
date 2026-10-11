import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/SongsTable';
import MonitoringPage from './pages/MonitoringPage'
import CalculatorPage from './pages/CalculatorPage';
import { useAuth } from './hooks/useAuth';
import Header from './components/Header';
import { useProfile } from './hooks/useProfile';
import { useRTL } from './hooks/useRTL';
import { RTLProvider } from './theme/RTLProvider';
import { useEffect, useMemo } from 'react';

import './App.css'
import SongFinderPage from './pages/SongFinderPage.tsx';
import logo from './assets/logo.png';

declare global {
  interface Window {
    HSStaticMethods?: { autoInit: () => void };
  }
}
function App() {
  useEffect(() => {
    window.HSStaticMethods?.autoInit();
  }, []);
  
  // Enable RTL/LTR switching based on language
  const { isRTL } = useRTL();
  
  const { user, loading: authLoading } = useAuth();
  const { role, loading: profileLoading } = useProfile(user);
  
  // Memoize the admin status to prevent unnecessary re-renders
  const isAdmin = useMemo(() => role === 'admin', [role]);
  const isLoading = useMemo(() => authLoading || profileLoading, [authLoading, profileLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[var(--color-bg)]">
        <img src={logo} alt="Yair Nitzani Music" className="h-16" />
        <div
          className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-[spin_0.6s_linear_infinite]"
          role="status"
          aria-label="Loading"
        />
      </div>
    );
  }
  
  return (
    <RTLProvider isRTL={isRTL}>
      <Router>
        <Header />
          <Routes>
            <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
            <Route path="/" element={user ? <CalculatorPage /> : <Navigate to="/login" />} />
            <Route path="/songs" element={user && isAdmin ? <AdminPage /> : <Navigate to="/login" />} />
            <Route path="/calculator" element={user ? <CalculatorPage /> : <Navigate to="/login" />} />
            <Route path="/monitoring" element={user && isAdmin ? <MonitoringPage /> : <Navigate to="/login" />} />
            <Route path="/find-a-song" element={user && isAdmin ? <SongFinderPage /> : <Navigate to="/login" />} />
            <Route path="/home" element={<Navigate to="/find-a-song" replace />} />

          </Routes>
          <script src="./assets/vendor/preline/dist/preline.js"></script>
      </Router>
    </RTLProvider>
  );
}

export default App;
