import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import logo from '../assets/logo.png'; // Uncomment if you put logo in src/assets

export default function Header() {
  const { user } = useAuth();
  const { role } = useProfile(user);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white shadow">
      <div className="flex items-center gap-2">
        <img src={logo} alt="Logo" className="h-20" />
        {/* <span className="font-bold text-xl">Nitzani Music</span> */}
      </div>
      <nav className="flex items-center gap-4">
        <Link to="/" className="text-blue-600 hover:underline">Home</Link>
        {role === 'admin' && (
          <Link to="/admin" className="text-blue-600 hover:underline">Admin</Link>
        )}
        {user && (
          <button
            onClick={handleSignOut}
            className="ml-4 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Sign Out
          </button>
        )}
      </nav>
    </header>
  );
}