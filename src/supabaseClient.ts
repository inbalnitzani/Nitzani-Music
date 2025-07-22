import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cdxfiukybimfperemdcn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkeGZpdWt5YmltZnBlcmVtZGNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTk3MjYsImV4cCI6MjA2ODU5NTcyNn0.OGXglhkIipbIcg6WC5-CX3qpYO0hlohXMP1D9FmxKEI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


