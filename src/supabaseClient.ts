import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://alnocrgekehivgngumyb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsbm9jcmdla2VoaXZnbmd1bXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4Mzc5NDMsImV4cCI6MjA2MzQxMzk0M30.LZAqLwXlyBoElugwv5qM6mHqAndWJ78piJfdnuwhcp4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


