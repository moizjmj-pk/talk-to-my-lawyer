/*
  Test Script: verify_allowance_logic.sql
  Description: Automated test sequence for letter allowance functions.
*/

DO $$
DECLARE
    test_user_id UUID := '00000000-0000-0000-0000-000000000001';
    result_bool BOOLEAN;
    remaining_val INT;
    total_gen INT;
BEGIN
    RAISE NOTICE 'Starting Letter Allowance Logic Tests...';

    -- 1. Setup
    DELETE FROM public.subscriptions WHERE user_id = test_user_id;
    DELETE FROM public.profiles WHERE id = test_user_id;
    
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (test_user_id, 'test@example.com', 'Test User', 'subscriber');

    INSERT INTO public.subscriptions (user_id, status, plan_type, remaining_letters, credits_remaining)
    VALUES (test_user_id, 'active', 'standard_4_month', 2, 2);

    -- 2. Test check_letter_allowance (Initial)
    SELECT has_allowance, remaining INTO result_bool, remaining_val 
    FROM public.check_letter_allowance(test_user_id);
    
    IF result_bool = TRUE AND remaining_val = 2 THEN
        RAISE NOTICE 'Test 1 (Initial Check): PASSED';
    ELSE
        RAISE EXCEPTION 'Test 1 (Initial Check): FAILED. Got %, expected true/2', result_bool;
    END IF;

    -- 3. Test deduct_letter_allowance (First Deduction)
    result_bool := public.deduct_letter_allowance(test_user_id);
    
    SELECT remaining_letters, total_letters_generated INTO remaining_val, total_gen
    FROM public.subscriptions s JOIN public.profiles p ON s.user_id = p.id
    WHERE p.id = test_user_id;

    IF result_bool = TRUE AND remaining_val = 1 AND total_gen = 1 THEN
        RAISE NOTICE 'Test 2 (First Deduction): PASSED';
    ELSE
        RAISE EXCEPTION 'Test 2 (First Deduction): FAILED. Remaining: %, Total Gen: %', remaining_val, total_gen;
    END IF;

    -- 4. Test deduct_letter_allowance (Last Deduction)
    result_bool := public.deduct_letter_allowance(test_user_id);
    
    SELECT has_allowance INTO result_bool FROM public.check_letter_allowance(test_user_id);

    IF result_bool = FALSE THEN
        RAISE NOTICE 'Test 3 (Last Deduction & Check): PASSED';
    ELSE
        RAISE EXCEPTION 'Test 3 (Last Deduction & Check): FAILED. Allowance still true after depletion.';
    END IF;

    -- 5. Test deduct_letter_allowance (Over-depletion)
    result_bool := public.deduct_letter_allowance(test_user_id);

    IF result_bool = FALSE THEN
        RAISE NOTICE 'Test 4 (Over-depletion): PASSED';
    ELSE
        RAISE EXCEPTION 'Test 4 (Over-depletion): FAILED. Allowed deduction with 0 credits.';
    END IF;

    -- 6. Cleanup
    DELETE FROM public.subscriptions WHERE user_id = test_user_id;
    DELETE FROM public.profiles WHERE id = test_user_id;
    
    RAISE NOTICE 'All Letter Allowance Logic Tests PASSED successfully.';
END $$;
