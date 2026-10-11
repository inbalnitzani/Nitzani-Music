import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient.ts';
import { useAuth } from '../hooks/useAuth.ts';
import { useProfile } from '../hooks/useProfile.ts';
import logo from '../assets/logo.png';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n.ts';
import { useState, useEffect } from 'react';
import { LogOut, Menu, X } from 'lucide-react';
import { Tooltip } from 'react-tooltip';

const navLinkClass = ({ isActive }: { isActive: boolean }) => `nav-link${isActive ? ' active' : ''}`;

// Shows the language you can switch to, as plain text
export function LanguageSwitch({ onChange, className = '' }: { onChange?: () => void; className?: string }) {
  const isHebrew = i18n.language?.startsWith('he');
  const target = isHebrew ? { lang: 'en', label: 'EN', name: 'English' } : { lang: 'he', label: 'עב', name: 'עברית' };
  return (
    <button
      type="button"
      lang={target.lang}
      aria-label={target.name}
      onClick={() => { i18n.changeLanguage(target.lang); onChange?.(); }}
      className={`px-2 py-1 rounded-md text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors ${className}`}
    >
      {target.label}
    </button>
  );
}

export default function Header() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { role } = useProfile(user);
  const navigate = useNavigate();
  const { pathname } = useLocation();
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

  // The login screen carries its own logo and language switch
  if (pathname === '/login') return null;

  return (
    <header
      className="site-header native-flex flex items-center justify-between h-16 md:h-[68px] px-4 md:px-10 bg-[var(--color-bg)] border-b border-[var(--color-border)]"
      dir="rtl"
    >
      <div className="flex items-center gap-2">
        <NavLink to="/" aria-label={t('header.home')}>
          <img src={logo} alt="Yair Nitzani Music" className="h-10 md:h-11" />
        </NavLink>
      </div>

      {/* Mobile menu button */}
      <button
        className="sm:hidden p-2 rounded-lg text-[var(--color-text)] hover:bg-[var(--color-border)]"
        aria-label={t('header.open_menu') || 'פתח תפריט'}
        aria-expanded={open}
        aria-controls="mobile-drawer"
        onClick={() => setOpen((v) => !v)}
      >
        <Menu size={24} aria-hidden />
      </button>

      {/*Desktop Navigation */}
      <div className="hidden sm:flex flex-1 items-center justify-between ms-10">
        <nav className="flex items-center gap-9">
          <NavLink to="/" end className={navLinkClass}>{t('header.home')}</NavLink>
          {role === 'admin' && (
            <>
              <NavLink to="/find-a-song" className={navLinkClass}>{t('header.song_finder')}</NavLink>
              <NavLink to="/songs" className={navLinkClass}>{t('header.songs')}</NavLink>
              <NavLink to="/monitoring" className={navLinkClass}>{t('header.monitor')}</NavLink>
            </>
          )}
        </nav>
        <div className="flex items-center gap-4">
          <LanguageSwitch />
          {user && (
            <button
              onClick={handleSignOut}
              className="p-2 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors"
              aria-label={t('header.sign_out')}
              data-tooltip-id="signOutTip"
              data-tooltip-place="bottom"
            >
              <LogOut size={20} strokeWidth={1.5} className="rtl:-scale-x-100" aria-hidden />
              <Tooltip id="signOutTip" content={t('header.sign_out')} />
            </button>
          )}
        </div>
      </div>
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
        className={`fixed inset-y-0 right-0 z-50 w-80 max-w-[85vw] bg-[var(--color-bg)] shadow-xl sm:hidden
                    transform transition-transform duration-[250ms] ease-[var(--ease-drawer)]
                    ${open ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <img src={logo} alt="" className="h-9" />
          <button
            className="p-2 rounded-lg text-[var(--color-text)] hover:bg-[var(--color-border)]"
            aria-label={t('header.close_menu') || 'סגור תפריט'}
            onClick={() => setOpen(false)}
          >
            <X size={22} aria-hidden />
          </button>
        </div>

        <nav className="mobile-nav flex flex-col gap-1 p-4 text-start text-lg">
          <NavLink to="/" end className={navLinkClass} onClick={() => setOpen(false)}>
            <span className="block py-2">{t('header.home')}</span>
          </NavLink>

          {role === 'admin' && (
            <>
              <NavLink to="/find-a-song" className={navLinkClass} onClick={() => setOpen(false)}>
                <span className="block py-2">{t('header.song_finder')}</span>
              </NavLink>
              <NavLink to="/songs" className={navLinkClass} onClick={() => setOpen(false)}>
                <span className="block py-2">{t('header.songs')}</span>
              </NavLink>
              <NavLink to="/monitoring" className={navLinkClass} onClick={() => setOpen(false)}>
                <span className="block py-2">{t('header.monitor')}</span>
              </NavLink>
            </>
          )}

          <div className="mt-3 border-t border-[var(--color-border)] pt-4 flex items-center justify-between">
            <LanguageSwitch onChange={() => setOpen(false)} />
            {user && (
              <button className="btn btn-secondary text-sm" onClick={handleSignOut}>
                <LogOut size={16} className="rtl:-scale-x-100" aria-hidden />
                {t('header.sign_out')}
              </button>
            )}
          </div>
        </nav>
      </aside>
    </header>
  );
}
