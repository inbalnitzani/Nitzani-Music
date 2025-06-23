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
  
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
  
        if (error) {
          setError(error.message);
        } else {
          setInfo('Check your email to verify your account');
          // Do not insert into 'profiles' table yet — user is not confirmed
        }
      } else {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  
        if (signInError) {
          setError(signInError.message);
        } else if (signInData.user) {
          // Insert into 'profiles' table only after user successfully signs in
          const { error: insertError } = await supabase.from('profiles').upsert([
            { id: signInData.user.id, email, role: 'user' }
          ]);
  
          if (insertError) {
            console.error('Failed to insert profile:', insertError);
          }
  
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