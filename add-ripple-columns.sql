-- =====================================================
-- SIMPLE RIPPLE COLUMNS UPDATE
-- =====================================================
-- Run this in your Supabase SQL Editor

-- Check if columns exist first, then add them if they don't
DO $$ 
BEGIN 
    -- Add ripple_parent_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'gratitude_messages' 
                   AND column_name = 'ripple_parent_id') THEN
        ALTER TABLE gratitude_messages 
        ADD COLUMN ripple_parent_id BIGINT REFERENCES gratitude_messages(id);
    END IF;
    
    -- Add ripple_depth column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'gratitude_messages' 
                   AND column_name = 'ripple_depth') THEN
        ALTER TABLE gratitude_messages 
        ADD COLUMN ripple_depth INTEGER DEFAULT 0;
    END IF;
    
    -- Add ripple_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'gratitude_messages' 
                   AND column_name = 'ripple_count') THEN
        ALTER TABLE gratitude_messages 
        ADD COLUMN ripple_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add inspired_by_message_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'gratitude_messages' 
                   AND column_name = 'inspired_by_message_id') THEN
        ALTER TABLE gratitude_messages 
        ADD COLUMN inspired_by_message_id BIGINT REFERENCES gratitude_messages(id);
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_gratitude_messages_ripple_parent ON gratitude_messages(ripple_parent_id);
CREATE INDEX IF NOT EXISTS idx_gratitude_messages_ripple_count ON gratitude_messages(ripple_count DESC);

-- Create simple trigger function
CREATE OR REPLACE FUNCTION update_ripple_count()
RETURNS TRIGGER AS $$
BEGIN
    -- When a new message is inserted with a ripple_parent_id
    IF NEW.ripple_parent_id IS NOT NULL THEN
        -- Update the parent message's ripple count
        UPDATE gratitude_messages 
        SET ripple_count = ripple_count + 1
        WHERE id = NEW.ripple_parent_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (drop first if exists)
DROP TRIGGER IF EXISTS trigger_update_ripple_count ON gratitude_messages;
CREATE TRIGGER trigger_update_ripple_count
    AFTER INSERT ON gratitude_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_ripple_count();

-- Verify the columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'gratitude_messages' 
AND column_name IN ('ripple_parent_id', 'ripple_depth', 'ripple_count', 'inspired_by_message_id')
ORDER BY column_name;
