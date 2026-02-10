-- Create a system user for importing datasets
INSERT INTO users (user_id, email, name, password_hash, is_verified, created_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'system@deanow.com',
    'System User',
    'SYSTEM_NO_LOGIN',
    true,
    NOW()
) ON CONFLICT (user_id) DO NOTHING;

-- Verify the user was created
SELECT user_id, email FROM users WHERE user_id = '00000000-0000-0000-0000-000000000001';
