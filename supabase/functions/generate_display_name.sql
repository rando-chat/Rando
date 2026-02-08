-- Random Display Name Generator
-- Returns a random adjective + noun combination
CREATE OR REPLACE FUNCTION public.generate_display_name(
    p_gender_preference TEXT DEFAULT 'neutral'
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
    -- Curated lists for quality names
    -- In production, these would be in a separate table
    DECLARE
        adjectives TEXT[] := ARRAY[
            -- Positive traits
            'Cosmic', 'Wonder', 'Solar', 'Lunar', 'Stellar', 'Galactic',
            'Electric', 'Mystic', 'Digital', 'Quantum', 'Neon', 'Phantom',
            'Arctic', 'Tropical', 'Sapphire', 'Emerald', 'Crimson', 'Golden',
            'Silver', 'Bronze', 'Platinum', 'Crystal', 'Amber', 'Jade',
            'Swift', 'Clever', 'Brave', 'Calm', 'Wise', 'Gentle',
            'Happy', 'Lucky', 'Bright', 'Smart', 'Wild', 'Free',
            -- Nature inspired
            'Flying', 'Running', 'Swimming', 'Soaring', 'Dancing', 'Singing',
            'Whispering', 'Rustling', 'Flowing', 'Glowing', 'Shining', 'Twinkling'
        ];
        
        nouns TEXT[] := ARRAY[
            -- Animals & Creatures
            'Penguin', 'Bee', 'Dolphin', 'Fox', 'Wolf', 'Lion', 'Tiger', 'Bear',
            'Owl', 'Eagle', 'Hawk', 'Raven', 'Phoenix', 'Dragon', 'Unicorn',
            'Butterfly', 'Dragonfly', 'Ladybug', 'Firefly', 'Bee', 'Ant',
            'Whale', 'Shark', 'Octopus', 'Seahorse', 'Turtle', 'Frog',
            -- Mythical & Fantasy
            'Wizard', 'Knight', 'Warrior', 'Archer', 'Mage', 'Rogue',
            'Dragon', 'Griffin', 'Pegasus', 'Mermaid', 'Sprite', 'Fairy',
            -- Tech & Space
            'Robot', 'Android', 'Cyborg', 'Drone', 'Satellite', 'Comet',
            'Asteroid', 'Nebula', 'Quasar', 'Pulsar', 'Voyager', 'Explorer',
            -- Nature
            'Forest', 'Mountain', 'River', 'Ocean', 'Sky', 'Star', 'Moon',
            'Sun', 'Cloud', 'Rain', 'Snow', 'Wind', 'Flame', 'Wave',
            -- Objects
            'Keeper', 'Guardian', 'Traveler', 'Seeker', 'Dreamer', 'Thinker',
            'Builder', 'Creator', 'Solver', 'Finder', 'Maker', 'Player'
        ];
        
        neutral_nouns TEXT[] := ARRAY[
            'Person', 'Being', 'Soul', 'Spirit', 'Entity', 'Presence',
            'Traveler', 'Explorer', 'Dreamer', 'Thinker', 'Creator', 'Learner',
            'Friend', 'Companion', 'Partner', 'Ally', 'Guide', 'Mentor'
        ];
    BEGIN
        -- Generate until we find a unique-ish name (up to 10 attempts)
        WHILE v_attempts < 10 LOOP
            -- Random adjective
            v_adjective := adjectives[floor(random() * array_length(adjectives, 1) + 1)];
            
            -- Select noun based on gender preference
            IF p_gender_preference = 'neutral' THEN
                v_noun := neutral_nouns[floor(random() * array_length(neutral_nouns, 1) + 1)];
            ELSE
                v_noun := nouns[floor(random() * array_length(nouns, 1) + 1)];
            END IF;
            
            -- Combine
            v_full_name := v_adjective || v_noun;
            
            -- Check if name is already taken recently (last 24 hours)
            -- This prevents too many duplicates
            PERFORM 1 FROM (
                SELECT display_name FROM public.users 
                WHERE created_at > NOW() - INTERVAL '24 hours'
                UNION ALL
                SELECT display_name FROM public.guest_sessions 
                WHERE created_at > NOW() - INTERVAL '24 hours'
            ) AS recent_names
            WHERE display_name = v_full_name;
            
            IF NOT FOUND THEN
                RETURN v_full_name;
            END IF;
            
            v_attempts := v_attempts + 1;
        END LOOP;
        
        -- If all attempts fail, add a random number
        RETURN v_full_name || floor(random() * 999 + 1)::TEXT;
    END;
END;
$$;