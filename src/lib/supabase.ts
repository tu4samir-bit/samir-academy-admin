import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'আপনার_আসল_SUPABASE_URL';
const supabaseAnonKey = 'আপনার_আসল_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
