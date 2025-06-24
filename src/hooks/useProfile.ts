import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '../types/profiles';

export function useProfile(user: User | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from('profiles')
      .select('id, updated_at, username, full_name, role')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setProfile(data);
        setLoading(false);
      });

  }, [user]);

  return { profile, loading, role: profile?.role || null };
} 