import { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient.ts';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '../types/profiles';

export function useProfile(user: User | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const profileRef = useRef<Profile | null>(null);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      if (profileRef.current !== null) {
        profileRef.current = null;
        setProfile(null);
      }
      setLoading(false);
      return;
    }

    // Only fetch if user ID actually changed
    if (userIdRef.current === user.id && profileRef.current) {
      return;
    }

    userIdRef.current = user.id;
    setLoading(true);
    
    supabase
      .from('profiles')
      .select('id, updated_at, username, full_name, role')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        // Only update if profile actually changed
        if (profileRef.current?.id !== data?.id || 
            profileRef.current?.updated_at !== data?.updated_at) {
          profileRef.current = data;
          setProfile(data);
        }
        setLoading(false);
      });

  }, [user?.id]); // Only depend on user.id, not the entire user object

  return { profile, loading, role: profile?.role || null };
} 