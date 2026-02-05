-- Insert admin user (password: admin123)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'admin@example.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  NOW(),
  NOW(),
  'authenticated',
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Insert admin profile
INSERT INTO users (
  id,
  email,
  username,
  tier,
  age_verified,
  email_verified,
  preferences
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@example.com',
  'Admin',
  'premium',
  true,
  true,
  '{}'
) ON CONFLICT (id) DO NOTHING;

-- Insert test users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES 
(
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'student@example.edu',
  crypt('student123', gen_salt('bf')),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  NOW(),
  NOW(),
  'authenticated',
  '',
  '',
  '',
  ''
),
(
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'premium@example.com',
  crypt('premium123', gen_salt('bf')),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  NOW(),
  NOW(),
  'authenticated',
  '',
  '',
  '',
  ''
),
(
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000000',
  'free@example.com',
  crypt('free123', gen_salt('bf')),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  NOW(),
  NOW(),
  'authenticated',
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Insert test user profiles
INSERT INTO users (id, email, username, tier, age_verified, email_verified, preferences) VALUES
('00000000-0000-0000-0000-000000000002', 'student@example.edu', 'StudentUser', 'student', true, true, '{"interests": ["Technology", "Gaming"]}'),
('00000000-0000-0000-0000-000000000003', 'premium@example.com', 'PremiumUser', 'premium', true, true, '{"interests": ["Music", "Travel"]}'),
('00000000-0000-0000-0000-000000000004', 'free@example.com', 'FreeUser', 'free', true, true, '{"interests": ["Movies", "Sports"]}')
ON CONFLICT (id) DO NOTHING;

-- Create some sample chat sessions
INSERT INTO chat_sessions (id, user1_id, user2_id, session_type, started_at) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'text', NOW() - INTERVAL '1 hour'),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'text', NOW() - INTERVAL '30 minutes');

-- Insert sample messages
INSERT INTO messages (id, session_id, sender_id, content, content_type, created_at) VALUES
(uuid_generate_v4(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Hello there!', 'text', NOW() - INTERVAL '55 minutes'),
(uuid_generate_v4(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'Hi! How are you?', 'text', NOW() - INTERVAL '54 minutes'),
(uuid_generate_v4(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'I''m good, thanks! What are you interested in?', 'text', NOW() - INTERVAL '53 minutes'),
(uuid_generate_v4(), '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'Nice to meet you!', 'text', NOW() - INTERVAL '25 minutes'),
(uuid_generate_v4(), '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 'Likewise! What do you like to chat about?', 'text', NOW() - INTERVAL '24 minutes');