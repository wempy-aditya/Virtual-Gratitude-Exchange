-- =====================================================
-- DEBUG RIPPLE COUNT ISSUE
-- =====================================================
-- Run these queries one by one to debug why ripple_count not updating

-- 1. CHECK IF TRIGGER FUNCTION EXISTS
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'update_ripple_count';

-- 2. CHECK IF TRIGGER EXISTS ON TABLE
SELECT trigger_name, event_manipulation, action_timing, action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'gratitude_messages'
AND trigger_name = 'trigger_update_ripple_count';

-- 3. CHECK RECENT MESSAGES WITH RIPPLE DATA
SELECT id, message, ripple_parent_id, ripple_depth, ripple_count, created_at
FROM gratitude_messages 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. CHECK IF ANY MESSAGES HAVE ripple_parent_id SET
SELECT COUNT(*) as total_messages,
       COUNT(ripple_parent_id) as messages_with_parent,
       COUNT(CASE WHEN ripple_count > 0 THEN 1 END) as messages_with_ripples
FROM gratitude_messages;

-- 5. CHECK RLS POLICIES THAT MIGHT BLOCK UPDATES
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'gratitude_messages';

-- 6. MANUAL TEST - INSERT MESSAGE WITH RIPPLE PARENT
-- (Replace parent_id with an actual ID from your table)
DO $$
DECLARE
    parent_id BIGINT;
    old_count INTEGER;
    new_count INTEGER;
BEGIN
    -- Get first message as parent
    SELECT id INTO parent_id FROM gratitude_messages ORDER BY created_at LIMIT 1;
    
    IF parent_id IS NOT NULL THEN
        -- Get current ripple count
        SELECT ripple_count INTO old_count FROM gratitude_messages WHERE id = parent_id;
        
        -- Insert child message
        INSERT INTO gratitude_messages (message, category, category_label, country, ripple_parent_id, ripple_depth)
        VALUES ('DEBUG: Test ripple child message', 'general', 'General', 'DEBUG', parent_id, 1);
        
        -- Check new ripple count
        SELECT ripple_count INTO new_count FROM gratitude_messages WHERE id = parent_id;
        
        -- Show results
        RAISE NOTICE 'Parent ID: %, Old Count: %, New Count: %', parent_id, old_count, new_count;
        
        IF new_count > old_count THEN
            RAISE NOTICE '✅ TRIGGER WORKING! Count increased from % to %', old_count, new_count;
        ELSE
            RAISE NOTICE '❌ TRIGGER NOT WORKING! Count stayed at %', old_count;
        END IF;
    ELSE
        RAISE NOTICE '❌ No messages found to test with';
    END IF;
END $$;

-- 7. RECREATE TRIGGER FUNCTION (if not working)
CREATE OR REPLACE FUNCTION update_ripple_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Debug log
    RAISE NOTICE 'Trigger fired! New ripple_parent_id: %', NEW.ripple_parent_id;
    
    -- When a new message is inserted with a ripple_parent_id
    IF NEW.ripple_parent_id IS NOT NULL THEN
        RAISE NOTICE 'Updating ripple count for parent ID: %', NEW.ripple_parent_id;
        
        -- Update the parent message's ripple count
        UPDATE gratitude_messages 
        SET ripple_count = ripple_count + 1
        WHERE id = NEW.ripple_parent_id;
        
        RAISE NOTICE 'Ripple count updated for parent ID: %', NEW.ripple_parent_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. RECREATE TRIGGER
DROP TRIGGER IF EXISTS trigger_update_ripple_count ON gratitude_messages;
CREATE TRIGGER trigger_update_ripple_count
    AFTER INSERT ON gratitude_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_ripple_count();

-- 9. TEST TRIGGER AGAIN AFTER RECREATING
DO $$
DECLARE
    parent_id BIGINT;
    old_count INTEGER;
    new_count INTEGER;
BEGIN
    -- Get first message as parent
    SELECT id INTO parent_id FROM gratitude_messages ORDER BY created_at LIMIT 1;
    
    IF parent_id IS NOT NULL THEN
        -- Get current ripple count
        SELECT ripple_count INTO old_count FROM gratitude_messages WHERE id = parent_id;
        
        -- Insert child message
        INSERT INTO gratitude_messages (message, category, category_label, country, ripple_parent_id, ripple_depth)
        VALUES ('DEBUG: Test ripple child message AFTER recreate', 'general', 'General', 'DEBUG', parent_id, 1);
        
        -- Check new ripple count
        SELECT ripple_count INTO new_count FROM gratitude_messages WHERE id = parent_id;
        
        -- Show results
        RAISE NOTICE 'AFTER RECREATE - Parent ID: %, Old Count: %, New Count: %', parent_id, old_count, new_count;
    END IF;
END $$;
