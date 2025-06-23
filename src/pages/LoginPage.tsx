import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [info, setInfo] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');
    let result;
    if (isSignUp) {
      result = await supabase.auth.signUp({ email, password });
      if (!result.error && result.data.user) {
        // Insert profile with default role
        await supabase.from('profiles').insert([
          { id: result.data.user.id, role: 'user', email: email }
        ]);
        setInfo('check your email for verification');
      } else {
        setInfo(result.error?.message || 'Something went wrong');
      }
    } else {
      result = await supabase.auth.signInWithPassword({ email, password });
    }
    if (result.error) setError(result.error.message);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded shadow">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isSignUp ? 'Sign Up' : 'Login'}
        </h2>
        <form className="space-y-4" onSubmit={handleAuth}>
          <input
            className="w-full px-3 py-2 border rounded"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <input
            className="w-full px-3 py-2 border rounded"
            placeholder="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Login'}
          </button>
        </form>
        {error && <div className="text-red-500 mt-2">{error}</div>}
        {info && <div className="text-green-600 mt-2">{info}</div>}
        <div className="mt-4 text-center">
          <button
            className="text-blue-600 hover:underline"
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            type="button"
          >
            {isSignUp
              ? 'Already have an account? Login'
              : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 