import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

console.log('DEBUG: VITE_SUPABASE_URL:', supabaseUrl);
console.log('DEBUG: VITE_SUPABASE_ANON_KEY:', supabaseKey ? supabaseKey.slice(0, 8) + '...' : '');

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

export default supabase