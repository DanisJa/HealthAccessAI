// supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://hkmeashdtfncnsxqhgob.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrbWVhc2hkdGZuY25zeHFoZ29iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzE1MDQzOSwiZXhwIjoyMDYyNzI2NDM5fQ.JxzGUU85fwASHTl2BOxYvZm7D_o_YTrtaj0mBQyCNiQ"; // For admin operations

console.log('Supabase Key:', supabaseKey);

export const supabase = createClient(supabaseUrl, supabaseKey);

