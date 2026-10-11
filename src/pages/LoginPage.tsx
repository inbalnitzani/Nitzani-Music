import React, { useState } from 'react';
import { supabase } from "../supabaseClient.ts";
import { useTranslation } from 'react-i18next';
import logo from '../assets/logo.png';
import BrandArc from '../components/BrandArc';
import { LanguageSwitch } from '../components/Header';

const LoginPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [info, setInfo] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useTranslation();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              username: name,
              phone: phoneNumber,
              company: companyName
            }
          }
        });

        if (error) {
          setError(error.message);
        } else {
          setInfo(t('login.check_email'));
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

        if (signInError) {
          setError(signInError.message);
        } else {
          setInfo(t('login.signed_in'));
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    }

    setLoading(false);
  };



  const switchMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setInfo('');
  };

  const fieldLabel = 'block mb-2 text-sm font-medium text-[var(--color-text-soft)]';

  return (
    // Panel comes first so it sits on top on phones; row-reverse puts the
    // form on the reading edge on desktop. (No `flex-col` here: the global
    // `.rtl .flex.flex-col` rule would override the desktop row.)
    <div className="login-page native-flex min-h-[100dvh] lg:flex lg:flex-row-reverse bg-[var(--color-bg)]">
      {/* Brand panel: a short band on phones, half the screen on desktop */}
      <aside className="relative overflow-hidden bg-[var(--color-primary-light)] h-[200px] lg:h-auto lg:w-1/2">
        <BrandArc
          strokeWidth={2.5}
          className="ltr:-scale-x-100 absolute w-[440px] h-[440px] -end-[250px] -top-10 lg:w-[980px] lg:h-[980px] lg:-end-[470px] lg:top-[15%]"
        />
        <div className="absolute start-5 bottom-6 max-w-[240px] lg:start-20 lg:bottom-20 lg:max-w-[440px]">
          <p className="text-[22px] lg:text-[40px] font-light leading-[1.25] tracking-[-0.01em] text-[var(--color-text)] [text-wrap:balance]">
            {t('login.statement')}
          </p>
          <p className="hidden lg:block mt-4 text-xs font-medium tracking-[0.14em] text-[var(--color-muted)]">
            YAIR NITZANI MUSIC
          </p>
        </div>
      </aside>

      {/* Form side (reading edge) */}
      <main className="lg:flex-1 flex flex-col px-5 sm:px-10 lg:px-16 pt-5 pb-10 lg:py-10">
        <div className="flex items-center justify-between">
          <img src={logo} alt="Yair Nitzani Music" className="h-10 lg:h-12" />
          <LanguageSwitch />
        </div>

        <div className="flex-1 flex items-center justify-center pt-8 lg:pt-0">
          <div className="enter-up w-full max-w-[380px]">
            <span className="eyebrow">{t('song_finder.eyebrow')}</span>
            <h1 className="display-title mt-4 text-[40px] sm:text-5xl text-[var(--color-text)]">
              {isSignUp ? t('login.sign_up') : t('login.headline')}
            </h1>
            <p className="mt-3 text-[17px] text-[var(--color-text-soft)]">
              {isSignUp ? t('login.sign_up_subtitle') : t('login.subtitle')}
            </p>

            <form className="mt-9 space-y-[18px]" onSubmit={handleAuth}>
              {isSignUp && (
                <div>
                  <label htmlFor="login-name" className={fieldLabel}>{t('login.name')}</label>
                  <input
                    id="login-name"
                    className="w-full input-base"
                    autoComplete="name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
              )}
              <div>
                <label htmlFor="login-email" className={fieldLabel}>{t('login.email')}</label>
                <input
                  id="login-email"
                  className="w-full input-base"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              {isSignUp && (
                <div>
                  <label htmlFor="login-phone" className={fieldLabel}>{t('login.phone')}</label>
                  <input
                    id="login-phone"
                    className="w-full input-base"
                    type="tel"
                    autoComplete="tel"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    required
                  />
                </div>
              )}
              {isSignUp && (
                <div>
                  <label htmlFor="login-company" className={fieldLabel}>{t('login.company')}</label>
                  <input
                    id="login-company"
                    className="w-full input-base"
                    autoComplete="organization"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    required
                  />
                </div>
              )}
              <div>
                <label htmlFor="login-password" className={fieldLabel}>{t('login.password')}</label>
                <div className="relative">
                  <input
                    id="login-password"
                    className="input-base w-full pe-20"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 end-0 px-4 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
                  >
                    {showPassword ? t('login.hide_password') : t('login.show_password')}
                  </button>
                </div>
              </div>
              <button
                className="btn btn-primary w-full h-[52px] text-base !mt-7"
                disabled={loading}
              >
                {loading ? (
                  <span
                    className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-[spin_0.6s_linear_infinite]"
                    role="status"
                    aria-label={t('login.loading')}
                  />
                ) : isSignUp ? t('login.sign_up') : t('login.login')}
              </button>
            </form>
            {error && (
              <div role="alert" className="mt-4 text-sm bg-[var(--color-danger-bg)] text-[var(--color-danger)] px-4 py-3 rounded-xl">
                {error}
              </div>
            )}
            {info && <div role="status" className="mt-4 text-sm bg-green-50 text-green-700 px-4 py-3 rounded-xl">{info}</div>}
            <p className="mt-6 text-[15px] text-[var(--color-muted)]">
              {isSignUp ? t('login.have_account') : t('login.no_account')}{' '}
              <button
                className="font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] hover:underline"
                onClick={switchMode}
                type="button"
              >
                {isSignUp ? t('login.login_cta') : t('login.sign_up_cta')}
              </button>
            </p>
          </div>
        </div>
      </main>

    </div>
  );
};

export default LoginPage; 