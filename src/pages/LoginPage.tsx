import React, { useState } from 'react';
import { supabase } from "../supabaseClient.ts";
import { useTranslation } from 'react-i18next';

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
          setInfo('Check your email to verify your account');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

        if (signInError) {
          setError(signInError.message);
        } else {
          setInfo('Successfully signed in');
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



  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded shadow">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isSignUp ? t('login.sign_up') : t('login.login')}
        </h2>
        <form className="space-y-4" onSubmit={handleAuth}>
          {isSignUp && (<input
            className="w-full input-base"
            placeholder={t('login.name')}
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />)}
          <input
            className="w-full input-base"
            placeholder={t('login.email')}
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          {isSignUp && (<input
            className="w-full input-base"
            placeholder={t('login.phone')}
            value={phoneNumber}
            onChange={e => setPhoneNumber(e.target.value)}
            required
          />)}
          {isSignUp && (
          <input
            className="w-full input-base"
            placeholder={t('login.company')}
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            required
          />)}
          <input
            className="input-base w-full  "
            placeholder={t('login.password')}
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? 'Loading...' : isSignUp ? t('login.sign_up') : t('login.login')}
          </button>
        </form>
        {error && <div className="text-red-500 mt-2">{error}</div>}
        {info && <div className="text-green-600 mt-2">{info}</div>}
        <div className="mt-4 text-center">
          <button
            className="nav-link"
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            type="button"
          >
            {isSignUp
              ? t('login.login_msg')
              : t('login.sign_up_msg')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 