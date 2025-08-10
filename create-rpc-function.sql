-- ============================================================
-- CREATE RPC FUNCTION FOR MANUAL RIPPLE COUNT UPDATE
-- ============================================================
-- Run this in Supabase SQL Editor

-- Create RPC function to increment ripple count
CREATE OR REPLACE FUNCTION increment_ripple_count(parent_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update the ripple count
    UPDATE gratitude_messages 
    SET ripple_count = COALESCE(ripple_count, 0) + 1
    WHERE id = parent_id;
    
    -- Return true if update was successful
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_ripple_count(BIGINT) TO anon;
GRANT EXECUTE ON FUNCTION increment_ripple_count(BIGINT) TO authenticated;

-- Test the RPC function
DO $$
DECLARE
    test_parent_id BIGINT;
    old_count INTEGER;
    new_count INTEGER;
    success BOOLEAN;
BEGIN
    -- Get an existing message
    SELECT id INTO test_parent_id 
    FROM gratitude_messages 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF test_parent_id IS NOT NULL THEN
        -- Get current count
        SELECT COALESCE(ripple_count, 0) INTO old_count 
        FROM gratitude_messages 
        WHERE id = test_parent_id;
        
        -- Test RPC function
        SELECT increment_ripple_count(test_parent_id) INTO success;
        
        -- Check new count
        SELECT COALESCE(ripple_count, 0) INTO new_count 
        FROM gratitude_messages 
        WHERE id = test_parent_id;
        
        RAISE NOTICE 'RPC Test: Parent %, Count % → %, Success: %', 
                     test_parent_id, old_count, new_count, success;
        
        -- Reset for clean test
        UPDATE gratitude_messages 
        SET ripple_count = old_count 
        WHERE id = test_parent_id;
    END IF;
END $$;
