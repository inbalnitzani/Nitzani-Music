import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import AdminPage from './pages/SongsTable';
import CalculatorPage from './pages/CalculatorPage';
import { useAuth } from './hooks/useAuth';
import Header from './components/Header';
import { useProfile } from './hooks/useProfile';
import { useEffect } from 'react';

import './App.css'

declare global {
  interface Window {
    HSStaticMethods?: { autoInit: () => void };
  }
}
function App() {
  useEffect(() => {
    window.HSStaticMethods?.autoInit();
  }, []);
  const { user, loading: authLoading } = useAuth();
  const { role, loading: profileLoading } = useProfile(user);
  const isAdmin = role === 'admin';

  if (authLoading || profileLoading) return <div>Loading...</div>;
  return (
      <Router>
        <Header />
          <Routes>
            <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
            <Route path="/" element={user ? <CalculatorPage /> : <Navigate to="/login" />} />
            <Route path="/songs" element={user && isAdmin ? <AdminPage /> : <Navigate to="/login" />} />
            <Route path="/calculator" element={user && isAdmin ? <CalculatorPage /> : <Navigate to="/login" />} />
          </Routes>
          <script src="./assets/vendor/preline/dist/preline.js"></script>
      </Router>
  );
}

export default App;
