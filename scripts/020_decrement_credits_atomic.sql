-- Function to safely decrement credits avoiding race conditions
CREATE OR REPLACE FUNCTION decrement_credits_atomic(p_user_id UUID, p_amount INT)
RETURNS INT AS $$
DECLARE
  current_credits INT;
  v_user_role TEXT;
BEGIN
  -- Lock the row for update
  SELECT credits_remaining, role INTO current_credits, v_user_role
  FROM profiles 
  WHERE id = p_user_id 
  FOR UPDATE;
  
  -- If user not found
  IF current_credits IS NULL THEN
    RETURN -2; 
  END IF;

  -- Admin or Employee usually have unlimited or different logic? 
  -- Assuming this function is for standard credit consumption.
  
  IF current_credits >= p_amount THEN
    UPDATE profiles 
    SET credits_remaining = credits_remaining - p_amount
    WHERE id = p_user_id;
    RETURN current_credits - p_amount;
  ELSE
    RETURN -1; -- Insufficient credits
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- SECURITY DEFINER allows this to run with higher privileges if needed, 
-- but RLS should be handled carefully. Ideally should be called by authenticated user.
-- Grant execute
GRANT EXECUTE ON FUNCTION decrement_credits_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_credits_atomic TO service_role;
