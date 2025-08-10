// Supabase Configuration
// TODO: Ganti dengan URL dan API Key dari proyek Supabase Anda
const SUPABASE_CONFIG = {
    url: 'https://hxbujiubaasvhsvzmvyj.supabase.co', // Contoh: https://abcdefgh.supabase.co
    apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4YnVqaXViYWFzdmhzdnptdnlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3ODI1NTMsImV4cCI6MjA3MDM1ODU1M30.HrMwEKj9OiImUulWGpwWV5zIpkq3deNZfC9Mz_67mxM', // Public anon key dari Supabase
};

// Database table schema yang akan dibuat di Supabase:
/*
Table: gratitude_messages
Columns:
- id (int8, primary key, auto increment)
- message (text, not null)
- category (text, not null)
- category_label (text, not null)
- created_at (timestamptz, default: now())
- country (text, nullable)
- is_anonymous (boolean, default: true)

Table: app_stats
Columns:
- id (int8, primary key, auto increment)
- total_messages (int8, default: 0)
- active_users (int8, default: 0)
- updated_at (timestamptz, default: now())
*/

// Export configuration
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
