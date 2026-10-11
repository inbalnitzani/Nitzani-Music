import React, { useState } from 'react';
import { supabase } from "../supabaseClient.ts";
import { useTranslation } from 'react-i18next';
import logo from '../assets/logo.png';

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

  return (
    <div className="login-page native-flex flex min-h-[calc(100vh-4.5rem)] items-center justify-center bg-[var(--color-bg)] px-4 py-10">
      <div className="w-full max-w-[400px] flex flex-col items-center gap-6">
        <img src={logo} alt="Yair Nitzani Music" className="h-16 sm:h-[72px]" />
        <div className="w-full bg-white border border-[var(--color-border)] rounded-2xl px-6 py-7 sm:px-8 sm:py-8 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]">
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">
            {isSignUp ? t('login.sign_up') : t('login.login')}
          </h1>
          <p className="mt-1 mb-6 text-sm text-[var(--color-muted)]">
            {isSignUp ? t('login.sign_up_subtitle') : t('login.subtitle')}
          </p>
          <form className="space-y-3.5" onSubmit={handleAuth}>
            {isSignUp && (<input
              className="w-full input-base"
              placeholder={t('login.name')}
              aria-label={t('login.name')}
              autoComplete="name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />)}
            <input
              className="w-full input-base"
              type="email"
              placeholder={t('login.email')}
              aria-label={t('login.email')}
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            {isSignUp && (<input
              className="w-full input-base"
              type="tel"
              placeholder={t('login.phone')}
              aria-label={t('login.phone')}
              autoComplete="tel"
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
              required
            />)}
            {isSignUp && (
            <input
              className="w-full input-base"
              placeholder={t('login.company')}
              aria-label={t('login.company')}
              autoComplete="organization"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              required
            />)}
            <input
              className="input-base w-full"
              placeholder={t('login.password')}
              aria-label={t('login.password')}
              type="password"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button
              className="btn btn-primary w-full py-3"
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
            <div role="alert" className="mt-4 text-sm bg-[var(--color-danger-bg)] text-[var(--color-danger)] px-3.5 py-2.5 rounded-[10px]">
              {error}
            </div>
          )}
          {info && <div role="status" className="mt-4 text-sm bg-green-50 text-green-700 px-3.5 py-2.5 rounded-[10px]">{info}</div>}
          <p className="mt-5 text-center text-sm text-[var(--color-muted)]">
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
    </div>
  );
};

export default LoginPage; 