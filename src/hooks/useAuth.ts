import { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient.ts';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const userRef = useRef<User | null>(null);

    useEffect(() => {
        const getSession = async () => {
            const { data } = await supabase.auth.getSession();
            const newUser = data.session?.user ?? null;
            // Only update if user actually changed
            if (userRef.current?.id !== newUser?.id) {
                userRef.current = newUser;
                setUser(newUser);
            }
            setLoading(false);
        };
        getSession();

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            const newUser = session?.user ?? null;
            // Only update if user actually changed
            if (userRef.current?.id !== newUser?.id) {
                userRef.current = newUser;
                setUser(newUser);
            }
        });

        return () => {
            listener.subscription.unsubscribe();
        };
    }, []);

    return { user, loading };
}