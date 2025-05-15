// supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_REACT_APP_SUPABASE_URL!;
const supabaseKey = import.meta.env.VITE_REACT_APP_SUPABASE_SERVICE_KEY!; // For admin operations

console.log('Supabase URL:', supabaseUrl, import.meta.env.VITE_REACT_APP_SUPABASE_URL);
console.log('Supabase Key:', supabaseKey);

export const supabase = createClient(supabaseUrl, supabaseKey);

