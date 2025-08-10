import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import logo from '../assets/logo.png'; // Uncomment if you put logo in src/assets
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import hebrew from '../assets/israel.png';
import english from '../assets/united-kingdom.png';

export default function Header() {
  const { t } = useTranslation();
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
        <img src={logo} alt="Logo" className="h-12 md:h-20 pr-4 md:pr-10" />
        {/* <span className="font-bold text-xl">Nitzani Music</span> */}       

      </div>

      <nav className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4 mt-2 md:mt-0">
        <Link to="/" className="nav-link">{t('header.home')}</Link>
        {role === 'admin' && (
          <>
            <Link to="/songs" className="nav-link">{t('header.songs')}</Link>
            <Link to="/monitoring" className="nav-link">{t('header.monitor')}</Link>

          </>
        )}
        <div className="flex gap-2 justify-end">
          <button onClick={() => i18n.changeLanguage('he')}>
            <img src={hebrew} alt="Hebrew" className="h-6" />
          </button>
          <button onClick={() => i18n.changeLanguage('en')}>
            <img src={english} alt="English" className="h-6" />
          </button>
        </div>
        {user && (
          <button
            onClick={handleSignOut}
            className="btn btn-danger"
          >
            {t('header.sign_out')}
          </button>
        )}
      </nav>

    </header>
  );
}