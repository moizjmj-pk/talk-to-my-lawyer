-- Fix deduct_letter_allowance to be atomic using FOR UPDATE
CREATE OR REPLACE FUNCTION deduct_letter_allowance(u_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    sub_record RECORD;
    profile_record RECORD;
BEGIN
    -- Check if user is super user (unlimited)
    SELECT is_super_user INTO profile_record
    FROM profiles
    WHERE id = u_id;
    
    IF profile_record.is_super_user THEN
        RETURN true; -- Super users have unlimited
    END IF;

    -- Get active subscription with LOCK
    SELECT * INTO sub_record
    FROM subscriptions
    WHERE user_id = u_id
      AND status = 'active'
      AND (remaining_letters > 0 OR plan = 'one_time') -- optimization? no, just lock
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE; -- Critical for race condition prevention

    IF NOT FOUND THEN
        RETURN false; -- No active subscription
    END IF;

    IF sub_record.remaining_letters <= 0 THEN
        RETURN false; -- No letters remaining
    END IF;

    -- Deduct 1 letter
    UPDATE subscriptions
    SET remaining_letters = remaining_letters - 1,
        updated_at = NOW()
    WHERE id = sub_record.id;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
