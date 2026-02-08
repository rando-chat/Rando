-- Seed Data for Display Names
-- These tables provide curated name components

-- Adjective table for name generation
CREATE TABLE IF NOT EXISTS public.name_adjectives (
    id SERIAL PRIMARY KEY,
    adjective TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL CHECK (category IN (
        'nature', 'color', 'positive', 'space', 'element', 'mystical'
    )),
    popularity INTEGER DEFAULT 1, -- 1-10, higher = more common
    is_active BOOLEAN DEFAULT true
);

-- Noun table for name generation
CREATE TABLE IF NOT EXISTS public.name_nouns (
    id SERIAL PRIMARY KEY,
    noun TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL CHECK (category IN (
        'animal', 'mythical', 'occupation', 'nature', 'object', 'neutral'
    )),
    gender_association TEXT CHECK (gender_association IN ('male', 'female', 'neutral')),
    popularity INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true
);

-- Insert adjectives
INSERT INTO public.name_adjectives (adjective, category, popularity) VALUES
-- Space & Cosmic
('Cosmic', 'space', 8),
('Stellar', 'space', 7),
('Galactic', 'space', 6),
('Solar', 'space', 7),
('Lunar', 'space', 7),
('Nebula', 'space', 5),
('Quantum', 'space', 6),
('Orbital', 'space', 4),

-- Nature
('Arctic', 'nature', 6),
('Tropical', 'nature', 5),
('Forest', 'nature', 7),
('Mountain', 'nature', 6),
('Ocean', 'nature', 7),
('River', 'nature', 5),
('Desert', 'nature', 4),

-- Colors
('Crimson', 'color', 6),
('Emerald', 'color', 6),
('Sapphire', 'color', 5),
('Golden', 'color', 8),
('Silver', 'color', 7),
('Amber', 'color', 5),
('Jade', 'color', 5),

-- Positive Traits
('Brave', 'positive', 7),
('Wise', 'positive', 8),
('Swift', 'positive', 6),
('Clever', 'positive', 6),
('Gentle', 'positive', 5),
('Happy', 'positive', 7),
('Lucky', 'positive', 6),

-- Mystical
('Mystic', 'mystical', 6),
('Phantom', 'mystical', 5),
('Shadow', 'mystical', 5),
('Spirit', 'mystical', 6),
('Dream', 'mystical', 7),
('Magic', 'mystical', 7),

-- Elements
('Electric', 'element', 7),
('Fiery', 'element', 6),
('Frozen', 'element', 5),
('Rocky', 'element', 4),
('Wind', 'element', 5),
('Water', 'element', 6)
ON CONFLICT (adjective) DO NOTHING;

-- Insert nouns
INSERT INTO public.name_nouns (noun, category, gender_association, popularity) VALUES
-- Animals (mostly neutral)
('Penguin', 'animal', 'neutral', 9),
('Dolphin', 'animal', 'neutral', 7),
('Fox', 'animal', 'neutral', 8),
('Wolf', 'animal', 'neutral', 8),
('Bear', 'animal', 'neutral', 7),
('Owl', 'animal', 'neutral', 6),
('Eagle', 'animal', 'neutral', 7),
('Raven', 'animal', 'neutral', 5),

-- Mythical
('Dragon', 'mythical', 'neutral', 9),
('Phoenix', 'mythical', 'neutral', 7),
('Unicorn', 'mythical', 'neutral', 6),
('Griffin', 'mythical', 'neutral', 4),
('Pegasus', 'mythical', 'neutral', 5),

-- Occupations
('Warrior', 'occupation', 'neutral', 7),
('Wizard', 'occupation', 'neutral', 8),
('Knight', 'occupation', 'neutral', 6),
('Archer', 'occupation', 'neutral', 5),
('Mage', 'occupation', 'neutral', 6),
('Explorer', 'occupation', 'neutral', 7),
('Guardian', 'occupation', 'neutral', 6),

-- Nature
('Forest', 'nature', 'neutral', 5),
('Mountain', 'nature', 'neutral', 5),
('River', 'nature', 'neutral', 4),
('Ocean', 'nature', 'neutral', 6),
('Sky', 'nature', 'neutral', 5),
('Star', 'nature', 'neutral', 8),
('Moon', 'nature', 'neutral', 7),
('Sun', 'nature', 'neutral', 6),

-- Objects
('Blade', 'object', 'neutral', 5),
('Shield', 'object', 'neutral', 4),
('Compass', 'object', 'neutral', 3),
('Lantern', 'object', 'neutral', 4),
('Key', 'object', 'neutral', 3),

-- Neutral (for gender-neutral names)
('Being', 'neutral', 'neutral', 5),
('Soul', 'neutral', 'neutral', 6),
('Spirit', 'neutral', 'neutral', 6),
('Traveler', 'neutral', 'neutral', 7),
('Dreamer', 'neutral', 'neutral', 6),
('Thinker', 'neutral', 'neutral', 5),
('Friend', 'neutral', 'neutral', 7),

-- Insects & Small Creatures
('Butterfly', 'animal', 'neutral', 6),
('Dragonfly', 'animal', 'neutral', 5),
('Firefly', 'animal', 'neutral', 5),
('Bee', 'animal', 'neutral', 8),
('Ladybug', 'animal', 'neutral', 4)
ON CONFLICT (noun) DO NOTHING;

-- Create an improved name generation function using the tables
CREATE OR REPLACE FUNCTION public.generate_display_name_v2(
    p_gender_preference TEXT DEFAULT 'neutral',
    p_category_preference TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_adjective TEXT;
    v_noun TEXT;
    v_full_name TEXT;
    v_attempts INTEGER := 0;
BEGIN
    WHILE v_attempts < 10 LOOP
        -- Get random adjective (weighted by popularity)
        SELECT adjective INTO v_adjective
        FROM public.name_adjectives
        WHERE is_active = true
        AND (p_category_preference IS NULL OR category = p_category_preference)
        ORDER BY random() * popularity DESC
        LIMIT 1;
        
        -- Get random noun based on preference
        IF p_gender_preference = 'neutral' THEN
            SELECT noun INTO v_noun
            FROM public.name_nouns
            WHERE is_active = true
            AND gender_association = 'neutral'
            ORDER BY random() * popularity DESC
            LIMIT 1;
        ELSE
            SELECT noun INTO v_noun
            FROM public.name_nouns
            WHERE is_active = true
            AND (gender_association = p_gender_preference OR gender_association = 'neutral')
            ORDER BY random() * popularity DESC
            LIMIT 1;
        END IF;
        
        -- Combine
        v_full_name := v_adjective || v_noun;
        
        -- Check for recent duplicates
        PERFORM 1 FROM (
            SELECT display_name FROM public.users 
            WHERE created_at > NOW() - INTERVAL '6 hours'
            UNION ALL
            SELECT display_name FROM public.guest_sessions 
            WHERE created_at > NOW() - INTERVAL '6 hours'
        ) AS recent_names
        WHERE display_name = v_full_name;
        
        IF NOT FOUND THEN
            RETURN v_full_name;
        END IF;
        
        v_attempts := v_attempts + 1;
    END LOOP;
    
    -- Fallback with number
    RETURN v_full_name || floor(random() * 999 + 1)::TEXT;
END;
$$;

-- Update the create_guest_session to use v2
CREATE OR REPLACE FUNCTION public.create_guest_session_v2(
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_country_code CHAR(2) DEFAULT NULL
)
RETURNS TABLE(
    guest_id UUID,
    session_token TEXT,
    display_name TEXT,
    expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Use the new v2 function
    RETURN QUERY
    SELECT * FROM public.create_guest_session(
        p_ip_address,
        p_user_agent,
        p_country_code
    );
END;
$$;