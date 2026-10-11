import { NavLink, useNavigate } from 'react-router-dom';
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

function LanguageSwitch({ onChange }: { onChange?: () => void }) {
  const isHebrew = i18n.language?.startsWith('he');
  const options = [
    { lang: 'he', label: 'עב', active: isHebrew },
    { lang: 'en', label: 'EN', active: !isHebrew },
  ];
  return (
    <div className="flex p-[3px] rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)]" role="group" aria-label="Language">
      {options.map(({ lang, label, active }) => (
        <button
          key={lang}
          type="button"
          lang={lang}
          aria-pressed={active}
          onClick={() => { i18n.changeLanguage(lang); onChange?.(); }}
          className={`px-2.5 py-1 rounded-md text-[13px] font-medium transition-colors ${
            active ? 'bg-white text-[var(--color-text)] shadow-sm' : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

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
    <header
      className="site-header native-flex flex items-center justify-between h-16 md:h-[72px] px-4 md:px-8 bg-white border-b border-[var(--color-border)]"
      dir="rtl"
    >
      <div className="flex items-center gap-2">
        <NavLink to="/" aria-label={t('header.home')}>
          <img src={logo} alt="Yair Nitzani Music" className="h-10 md:h-[52px]" />
        </NavLink>
      </div>

      {/* Mobile menu button */}
      <button
        className="sm:hidden p-2 rounded-lg text-[var(--color-text)] hover:bg-[var(--color-bg)]"
        aria-label={t('header.open_menu') || 'פתח תפריט'}
        aria-expanded={open}
        aria-controls="mobile-drawer"
        onClick={() => setOpen((v) => !v)}
      >
        <Menu size={24} aria-hidden />
      </button>

      {/*Desktop Navigation */}
      <div className="hidden sm:flex items-center gap-10">
        <nav className="flex items-center gap-7">
          <NavLink to="/" end className={navLinkClass}>{t('header.home')}</NavLink>
          {role === 'admin' && (
            <>
              <NavLink to="/find-a-song" className={navLinkClass}>{t('header.song_finder')}</NavLink>
              <NavLink to="/songs" className={navLinkClass}>{t('header.songs')}</NavLink>
              <NavLink to="/monitoring" className={navLinkClass}>{t('header.monitor')}</NavLink>
            </>
          )}
        </nav>
        <div className="flex items-center gap-3">
          <LanguageSwitch />
          {user && (
            <button
              onClick={handleSignOut}
              className="p-2 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-bg)] transition-colors"
              aria-label={t('header.sign_out')}
              data-tooltip-id="signOutTip"
              data-tooltip-place="bottom"
            >
              <LogOut size={20} className="rtl:-scale-x-100" aria-hidden />
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
        className={`fixed inset-y-0 right-0 z-50 w-80 max-w-[85vw] bg-white shadow-xl sm:hidden
                    transform transition-transform duration-[250ms] ease-[var(--ease-drawer)]
                    ${open ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <img src={logo} alt="" className="h-9" />
          <button
            className="p-2 rounded-lg text-[var(--color-text)] hover:bg-[var(--color-bg)]"
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
