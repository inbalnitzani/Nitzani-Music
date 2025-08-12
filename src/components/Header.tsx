import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import logo from '../assets/logo.png'; // Uncomment if you put logo in src/assets
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import hebrew from '../assets/israel.png';
import english from '../assets/united-kingdom.png';
import { useState, useEffect } from 'react';

export default function Header() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { role } = useProfile(user);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };


  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white shadow" dir="rtl">
      <div className="flex items-center gap-2">
        <img src={logo} alt="Logo" className="h-12 md:h-20 pr-4 md:pr-10" />
        {/* <span className="font-bold text-xl">Nitzani Music</span> */}
        {/* Mobile menu button */}
        <button
          className="sm:hidden text-2xl px-3 py-2 rounded-md hover:bg-gray-100"
          aria-label={t('header.open_menu') || 'פתח תפריט'}
          aria-expanded={open}
          aria-controls="mobile-drawer"
          onClick={() => setOpen((v) => !v)}
        >
          ☰
        </button>
      </div>

      {/*Desktop Navigation */}
      <nav className="hidden sm:flex flex-row items-center gap-4">
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
      {/* ===== Mobile Drawer  ===== */}
      {/* background*/}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm sm:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/*Side drawer*/}
      <aside
        id="mobile-drawer"
        className={`fixed inset-y-0 right-0 z-50 w-80 max-w-[85vw] bg-white shadow-xl sm:hidden
                    transform transition-transform duration-300
                    ${open ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <span className="text-lg font-semibold">{t('header.menu') || 'תפריט'}</span>
          <button
            className="text-2xl leading-none px-2 py-1 rounded-md hover:bg-gray-100"
            aria-label={t('header.close_menu') || 'סגור תפריט'}
            onClick={() => setOpen(false)}
          >
            ×
          </button>
        </div>

        <nav className="flex flex-col gap-1 p-4 text-right">
          <Link to="/" className="nav-link py-2" onClick={() => setOpen(false)}>
            {t('header.home')}
          </Link>

          {role === 'admin' && (
            <>
              <Link to="/songs" className="nav-link py-2" onClick={() => setOpen(false)}>
                {t('header.songs')}
              </Link>
              <Link to="/monitoring" className="nav-link py-2" onClick={() => setOpen(false)}>
                {t('header.monitor')}
              </Link>
            </>
          )}

          <div className="mt-3 border-t pt-3 flex items-center justify-between">
            <div className="flex gap-3">
              <button
                className="p-1 rounded hover:bg-gray-100"
                onClick={() => { i18n.changeLanguage('he'); setOpen(false); }}
                aria-label="Hebrew"
              >
                <img src={hebrew} alt="Hebrew" className="h-6" />
              </button>
              <button
                className="p-1 rounded hover:bg-gray-100"
                onClick={() => { i18n.changeLanguage('en'); setOpen(false); }}
                aria-label="English"
              >
                <img src={english} alt="English" className="h-6" />
              </button>
            </div>

            {user && (
              <button className="btn btn-danger" onClick={handleSignOut}>
                {t('header.sign_out')}
              </button>
            )}
          </div>
        </nav>
      </aside>
    </header>
  );
}