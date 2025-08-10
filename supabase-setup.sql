-- =====================================================
-- VIRTUAL GRATITUDE EXCHANGE - SUPABASE SETUP SCRIPT
-- =====================================================
-- Jalankan script ini di SQL Editor Supabase Anda

-- 1. DROP existing tables if needed (uncomment if restarting)
-- DROP TABLE IF EXISTS gratitude_messages CASCADE;
-- DROP TABLE IF EXISTS app_stats CASCADE;

-- 2. CREATE TABLES
-- ================

-- Table untuk menyimpan pesan gratitude
CREATE TABLE IF NOT EXISTS gratitude_messages (
    id BIGSERIAL PRIMARY KEY,
    message TEXT NOT NULL CHECK (length(message) > 0 AND length(message) <= 280),
    category TEXT NOT NULL CHECK (category IN ('kindness', 'hardwork', 'friendship', 'help', 'inspiration', 'general')),
    category_label TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    country TEXT DEFAULT 'Unknown',
    is_anonymous BOOLEAN DEFAULT true
);

-- Table untuk statistik aplikasi
CREATE TABLE IF NOT EXISTS app_stats (
    id BIGSERIAL PRIMARY KEY,
    total_messages BIGINT DEFAULT 0,
    active_users BIGINT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CREATE INDEXES for better performance
-- =======================================
CREATE INDEX IF NOT EXISTS idx_gratitude_messages_created_at ON gratitude_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gratitude_messages_category ON gratitude_messages(category);
CREATE INDEX IF NOT EXISTS idx_gratitude_messages_country ON gratitude_messages(country);

-- 4. ENABLE ROW LEVEL SECURITY
-- ============================
ALTER TABLE gratitude_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_stats ENABLE ROW LEVEL SECURITY;

-- 5. CREATE RLS POLICIES
-- ======================

-- Policies for gratitude_messages table
DROP POLICY IF EXISTS "Allow public read access" ON gratitude_messages;
DROP POLICY IF EXISTS "Allow public insert access" ON gratitude_messages;

CREATE POLICY "Allow public read access" ON gratitude_messages
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON gratitude_messages
    FOR INSERT WITH CHECK (true);

-- Policies for app_stats table  
DROP POLICY IF EXISTS "Allow public read access" ON app_stats;
DROP POLICY IF EXISTS "Allow public update access" ON app_stats;

CREATE POLICY "Allow public read access" ON app_stats
    FOR SELECT USING (true);

CREATE POLICY "Allow public update access" ON app_stats
    FOR UPDATE USING (true);

CREATE POLICY "Allow public insert access" ON app_stats
    FOR INSERT WITH CHECK (true);

-- 6. INSERT INITIAL DATA
-- ======================

-- Insert initial stats record
INSERT INTO app_stats (id, total_messages, active_users) 
VALUES (1, 0, 0)
ON CONFLICT (id) DO UPDATE SET
    updated_at = NOW();

-- Insert sample gratitude messages
INSERT INTO gratitude_messages (message, category, category_label, country) VALUES
('Terima kasih telah selalu menyebarkan kebaikan di sekitar Anda. Dunia menjadi tempat yang lebih baik karena Anda.', 'kindness', 'Atas Kebaikan Hati', 'Indonesia'),
('Kerja keras dan dedikasi Anda sangat menginspirasi. Teruslah berjuang, hasil yang luar biasa menanti!', 'hardwork', 'Atas Kerja Keras', 'Malaysia'),
('Persahabatan seperti Anda adalah hadiah yang sangat berharga. Terima kasih telah menjadi teman yang luar biasa.', 'friendship', 'Atas Persahabatan', 'Singapore'),
('Bantuan yang Anda berikan sangat berarti. Anda telah membuat perbedaan besar dalam hidup seseorang.', 'help', 'Atas Bantuan', 'Thailand'),
('Anda adalah sumber inspirasi bagi banyak orang. Teruslah bersinar dan menginspirasi dunia!', 'inspiration', 'Atas Inspirasi', 'Philippines'),
('Hari ini saya ingin mengatakan terima kasih kepada Anda. Anda lebih berharga dari yang Anda sadari.', 'general', 'Apresiasi Umum', 'Vietnam'),
('Senyuman Anda dapat mencerahkan hari siapa pun. Terima kasih telah membawa cahaya ke dunia.', 'kindness', 'Atas Kebaikan Hati', 'Japan'),
('Usaha dan ketekunan Anda dalam mencapai tujuan sangat mengagumkan. Jangan pernah menyerah!', 'hardwork', 'Atas Kerja Keras', 'South Korea'),
('Dukungan Anda dalam masa-masa sulit tidak akan pernah terlupakan. Anda adalah sahabat sejati.', 'friendship', 'Atas Persahabatan', 'Australia'),
('Kerelaan Anda membantu orang lain tanpa mengharapkan imbalan membuat dunia menjadi tempat yang lebih baik.', 'help', 'Atas Bantuan', 'New Zealand')
ON CONFLICT DO NOTHING;

-- 7. UPDATE STATS with current count
-- ==================================
UPDATE app_stats 
SET 
    total_messages = (SELECT COUNT(*) FROM gratitude_messages),
    updated_at = NOW()
WHERE id = 1;

-- 8. CREATE FUNCTION to auto-update stats (optional)
-- ==================================================
CREATE OR REPLACE FUNCTION update_message_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE app_stats 
    SET 
        total_messages = (SELECT COUNT(*) FROM gratitude_messages),
        updated_at = NOW()
    WHERE id = 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update stats when new message is inserted
DROP TRIGGER IF EXISTS trigger_update_stats ON gratitude_messages;
CREATE TRIGGER trigger_update_stats
    AFTER INSERT ON gratitude_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_message_stats();

-- 9. VERIFICATION QUERIES
-- =======================
-- Uncomment these to verify your setup:

-- SELECT 'gratitude_messages count' as table_name, COUNT(*) as count FROM gratitude_messages
-- UNION ALL
-- SELECT 'app_stats count' as table_name, COUNT(*) as count FROM app_stats;

-- SELECT 'Sample message' as type, message, category_label, country, created_at 
-- FROM gratitude_messages 
-- ORDER BY created_at DESC 
-- LIMIT 3;

-- SELECT 'Current stats' as type, total_messages, active_users, updated_at 
-- FROM app_stats 
-- WHERE id = 1;

-- =====================================================
-- SETUP COMPLETE! 
-- =====================================================
-- Sekarang Anda dapat:
-- 1. Test koneksi dengan test-supabase.html
-- 2. Jalankan aplikasi utama di index.html
-- 3. Periksa Real-time di dashboard Supabase
-- =====================================================
