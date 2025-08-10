-- ============================================================
-- COMPREHENSIVE RIPPLE TRIGGER DEBUGGING & FIX
-- ============================================================
-- Run this step by step in Supabase SQL Editor

-- STEP 1: Check current table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'gratitude_messages' 
ORDER BY ordinal_position;

-- STEP 2: Check if trigger function exists
SELECT 
    p.proname as function_name,
    p.prokind as function_type,
    CASE WHEN p.prokind = 'f' THEN 'Function' ELSE 'Other' END as type_desc
FROM pg_proc p
WHERE p.proname = 'update_ripple_count';

-- STEP 3: Check if trigger exists on table
SELECT 
    trigger_name, 
    event_manipulation, 
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'gratitude_messages';

-- STEP 4: Check current RLS policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'gratitude_messages';

-- STEP 5: Check sample data
SELECT 
    id,
    LEFT(message, 50) as message_preview,
    ripple_parent_id,
    ripple_depth,
    ripple_count,
    created_at
FROM gratitude_messages 
ORDER BY created_at DESC 
LIMIT 10;

-- STEP 6: Count messages with ripple data
SELECT 
    COUNT(*) as total_messages,
    COUNT(ripple_parent_id) as messages_with_parent,
    COUNT(CASE WHEN ripple_count > 0 THEN 1 END) as messages_with_ripple_count,
    MAX(ripple_count) as max_ripple_count
FROM gratitude_messages;

-- STEP 7: FORCE CREATE/RECREATE TRIGGER FUNCTION
-- (This will work even if function exists)
CREATE OR REPLACE FUNCTION update_ripple_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Debug logging
    RAISE NOTICE 'TRIGGER FIRED: New message ID %, Parent ID %', NEW.id, NEW.ripple_parent_id;
    
    -- Only update if ripple_parent_id is not null
    IF NEW.ripple_parent_id IS NOT NULL THEN
        RAISE NOTICE 'UPDATING parent % ripple count', NEW.ripple_parent_id;
        
        -- Update parent message ripple count
        UPDATE gratitude_messages 
        SET ripple_count = COALESCE(ripple_count, 0) + 1
        WHERE id = NEW.ripple_parent_id;
        
        -- Log the update
        RAISE NOTICE 'UPDATED parent % ripple count', NEW.ripple_parent_id;
        
        -- Check if update was successful
        DECLARE
            updated_count INTEGER;
        BEGIN
            SELECT ripple_count INTO updated_count 
            FROM gratitude_messages 
            WHERE id = NEW.ripple_parent_id;
            
            RAISE NOTICE 'Parent % now has ripple_count: %', NEW.ripple_parent_id, updated_count;
        END;
    ELSE
        RAISE NOTICE 'No ripple parent ID, skipping update';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 8: DROP AND RECREATE TRIGGER
DROP TRIGGER IF EXISTS trigger_update_ripple_count ON gratitude_messages;

CREATE TRIGGER trigger_update_ripple_count
    AFTER INSERT ON gratitude_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_ripple_count();

-- STEP 9: GRANT NECESSARY PERMISSIONS
-- Make sure trigger can update the table
GRANT UPDATE ON gratitude_messages TO postgres;
GRANT UPDATE ON gratitude_messages TO anon;
GRANT UPDATE ON gratitude_messages TO authenticated;

-- STEP 10: UPDATE RLS POLICIES TO ALLOW TRIGGER UPDATES
-- Drop existing policies and recreate with proper permissions
DROP POLICY IF EXISTS "Allow public read access" ON gratitude_messages;
DROP POLICY IF EXISTS "Allow public insert access" ON gratitude_messages;
DROP POLICY IF EXISTS "Allow public update access" ON gratitude_messages;

-- Recreate policies with UPDATE permission
CREATE POLICY "Allow public read access" ON gratitude_messages
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON gratitude_messages
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access" ON gratitude_messages
    FOR UPDATE USING (true) WITH CHECK (true);

-- STEP 11: MANUAL TEST INSERT
-- Test with existing parent ID (replace with actual ID from your table)
DO $$
DECLARE
    test_parent_id BIGINT;
    old_count INTEGER;
    new_count INTEGER;
    new_message_id BIGINT;
BEGIN
    -- Get an existing message as parent
    SELECT id INTO test_parent_id 
    FROM gratitude_messages 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF test_parent_id IS NOT NULL THEN
        -- Get current ripple count
        SELECT COALESCE(ripple_count, 0) INTO old_count 
        FROM gratitude_messages 
        WHERE id = test_parent_id;
        
        RAISE NOTICE 'Testing with parent ID: %, current count: %', test_parent_id, old_count;
        
        -- Insert test ripple message
        INSERT INTO gratitude_messages (
            message, 
            category, 
            category_label, 
            country, 
            ripple_parent_id, 
            ripple_depth
        ) VALUES (
            'MANUAL TEST: This message was inspired by another!', 
            'general', 
            'General', 
            'TEST', 
            test_parent_id, 
            1
        ) RETURNING id INTO new_message_id;
        
        RAISE NOTICE 'Inserted new message ID: %', new_message_id;
        
        -- Check new ripple count
        SELECT COALESCE(ripple_count, 0) INTO new_count 
        FROM gratitude_messages 
        WHERE id = test_parent_id;
        
        RAISE NOTICE 'RESULT: Parent % count changed from % to %', test_parent_id, old_count, new_count;
        
        IF new_count > old_count THEN
            RAISE NOTICE '✅ SUCCESS: Trigger is working! Count increased.';
        ELSE
            RAISE NOTICE '❌ FAILED: Trigger not working. Count did not increase.';
        END IF;
    ELSE
        RAISE NOTICE '❌ No existing messages found to test with';
    END IF;
END $$;

-- STEP 12: Final verification
SELECT 
    'Final Check' as status,
    id,
    LEFT(message, 30) as message_preview,
    ripple_parent_id,
    ripple_count,
    created_at
FROM gratitude_messages 
WHERE message LIKE '%MANUAL TEST%' OR ripple_count > 0
ORDER BY created_at DESC;
