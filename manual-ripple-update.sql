-- ============================================================
-- MANUAL RIPPLE COUNT UPDATE (Alternative Solution)
-- ============================================================
-- Use this if trigger approach doesn't work

-- Check which messages have ripple_parent_id but parent has ripple_count = 0
SELECT 
    p.id as parent_id,
    p.message as parent_message,
    p.ripple_count as current_count,
    COUNT(c.id) as actual_children
FROM gratitude_messages p
LEFT JOIN gratitude_messages c ON c.ripple_parent_id = p.id
GROUP BY p.id, p.message, p.ripple_count
HAVING COUNT(c.id) > 0 AND p.ripple_count != COUNT(c.id)
ORDER BY p.created_at DESC;

-- Manual update ripple counts based on actual children
UPDATE gratitude_messages 
SET ripple_count = (
    SELECT COUNT(*) 
    FROM gratitude_messages children 
    WHERE children.ripple_parent_id = gratitude_messages.id
)
WHERE id IN (
    SELECT DISTINCT ripple_parent_id 
    FROM gratitude_messages 
    WHERE ripple_parent_id IS NOT NULL
);

-- Verify the updates
SELECT 
    p.id as parent_id,
    LEFT(p.message, 50) as parent_message,
    p.ripple_count,
    COUNT(c.id) as actual_children
FROM gratitude_messages p
LEFT JOIN gratitude_messages c ON c.ripple_parent_id = p.id
WHERE p.ripple_count > 0 OR COUNT(c.id) > 0
GROUP BY p.id, p.message, p.ripple_count
ORDER BY p.ripple_count DESC;
