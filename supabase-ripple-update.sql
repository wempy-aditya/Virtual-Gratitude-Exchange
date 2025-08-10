-- =====================================================
-- RIPPLE EFFECT DATABASE UPDATE SCRIPT
-- =====================================================
-- Run this script in your Supabase SQL Editor

-- 1. ADD RIPPLE COLUMNS TO EXISTING TABLE
-- ======================================
ALTER TABLE gratitude_messages 
ADD COLUMN IF NOT EXISTS ripple_parent_id BIGINT REFERENCES gratitude_messages(id),
ADD COLUMN IF NOT EXISTS ripple_depth INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ripple_count INTEGER DEFAULT 0;

-- 2. CREATE INDEXES FOR RIPPLE TRACKING
-- ====================================
CREATE INDEX IF NOT EXISTS idx_gratitude_messages_ripple_parent ON gratitude_messages(ripple_parent_id);
CREATE INDEX IF NOT EXISTS idx_gratitude_messages_ripple_count ON gratitude_messages(ripple_count DESC);
CREATE INDEX IF NOT EXISTS idx_gratitude_messages_ripple_depth ON gratitude_messages(ripple_depth);

-- 3. CREATE RIPPLE ANALYTICS VIEW
-- ===============================
CREATE OR REPLACE VIEW ripple_analytics AS
SELECT 
    id,
    message,
    category,
    category_label,
    created_at,
    country,
    ripple_count,
    ripple_depth,
    ripple_parent_id,
    CASE 
        WHEN ripple_count >= 10 THEN 'viral'
        WHEN ripple_count >= 5 THEN 'inspiring'
        WHEN ripple_count >= 1 THEN 'effective'
        ELSE 'single'
    END as ripple_level
FROM gratitude_messages
WHERE ripple_count >= 0
ORDER BY ripple_count DESC, created_at DESC;

-- 4. CREATE TRIGGER FUNCTION FOR AUTOMATIC RIPPLE COUNTING
-- ========================================================
CREATE OR REPLACE FUNCTION update_ripple_count()
RETURNS TRIGGER AS $$
BEGIN
    -- When a new message is inserted with a ripple_parent_id
    IF NEW.ripple_parent_id IS NOT NULL THEN
        -- Update the parent message's ripple count
        UPDATE gratitude_messages 
        SET ripple_count = ripple_count + 1
        WHERE id = NEW.ripple_parent_id;
        
        -- Also update the root parent if this is a deeper ripple
        IF NEW.ripple_depth > 1 THEN
            UPDATE gratitude_messages 
            SET ripple_count = ripple_count + 1
            WHERE id = (
                SELECT COALESCE(ripple_parent_id, id) 
                FROM gratitude_messages 
                WHERE id = NEW.ripple_parent_id
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. CREATE TRIGGER
-- =================
DROP TRIGGER IF EXISTS trigger_update_ripple_count ON gratitude_messages;
CREATE TRIGGER trigger_update_ripple_count
    AFTER INSERT ON gratitude_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_ripple_count();

-- 6. GRANT PERMISSIONS FOR RLS
-- ============================
-- Update existing policies to include new columns
DROP POLICY IF EXISTS "Allow public read access" ON gratitude_messages;
DROP POLICY IF EXISTS "Allow public insert access" ON gratitude_messages;

CREATE POLICY "Allow public read access" ON gratitude_messages
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON gratitude_messages
    FOR INSERT WITH CHECK (true);

-- 7. CREATE SAMPLE RIPPLE DATA (OPTIONAL - FOR TESTING)
-- =====================================================
-- Uncomment these lines if you want to add sample ripple data

-- INSERT INTO gratitude_messages (message, category, category_label, country, ripple_count) VALUES
-- ('Thank you for always being there for me!', 'friendship', 'Friendship', 'USA', 5),
-- ('Your kindness made my day brighter', 'kindness', 'Kindness', 'Canada', 3),
-- ('I appreciate your hard work and dedication', 'hardwork', 'Hard Work', 'UK', 7),
-- ('Thanks for helping me when I needed it most', 'help', 'Help & Support', 'Australia', 2);

-- Add some ripple relationships
-- INSERT INTO gratitude_messages (message, category, category_label, country, ripple_parent_id, ripple_depth) VALUES
-- ('Inspired by your message, I want to thank my friend too!', 'friendship', 'Friendship', 'Germany', 1, 1),
-- ('Your gratitude post made me reflect on kindness', 'kindness', 'Kindness', 'France', 2, 1),
-- ('Reading about dedication inspired me to appreciate my team', 'hardwork', 'Hard Work', 'Japan', 3, 1);

-- 8. VERIFY SETUP
-- ===============
-- Run this to check if everything is working:
-- SELECT * FROM ripple_analytics LIMIT 5;
-- SELECT message, ripple_count, ripple_depth FROM gratitude_messages WHERE ripple_parent_id IS NOT NULL;

COMMIT;
