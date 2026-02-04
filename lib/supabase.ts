
import { createClient } from '@supabase/supabase-js';

/* 
  PENTING: Jika Anda mendapatkan error "relation already exists", 
  itu karena tabel sudah ada. JANGAN gunakan CREATE TABLE lagi.
  
  JALANKAN PERINTAH INI DI SQL EDITOR SUPABASE UNTUK UPDATE:

  -- Tambahkan kolom baru ke tabel yang sudah ada
  ALTER TABLE classes ADD COLUMN IF NOT EXISTS "teacherName" TEXT;
  ALTER TABLE classes ADD COLUMN IF NOT EXISTS "teacherNip" TEXT;
  ALTER TABLE classes ADD COLUMN IF NOT EXISTS "headmasterName" TEXT;
  ALTER TABLE classes ADD COLUMN IF NOT EXISTS "headmasterNip" TEXT;

  -- Nonaktifkan RLS agar aplikasi bisa akses data
  ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
  ALTER TABLE students DISABLE ROW LEVEL SECURITY;
  ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
*/

const supabaseUrl = 'https://xhrqpqkfwabzhewokaqj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocnFwcWtmd2Fiemhld29rYXFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMDUxNDAsImV4cCI6MjA4NTc4MTE0MH0.Jp6kkiw91jR5uLZTne6_isXq7wSdhKlGjUsugrPcY1s';

export const supabase = createClient(supabaseUrl, supabaseKey);
