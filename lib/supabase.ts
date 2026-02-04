
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xhrqpqkfwabzhewokaqj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocnFwcWtmd2Fiemhld29rYXFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMDUxNDAsImV4cCI6MjA4NTc4MTE0MH0.Jp6kkiw91jR5uLZTne6_isXq7wSdhKlGjUsugrPcY1s';

export const supabase = createClient(supabaseUrl, supabaseKey);
