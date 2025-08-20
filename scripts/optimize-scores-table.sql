-- Add unique constraint to prevent duplicate scores per user per difficulty
-- This will help ensure we only keep the highest score per user per difficulty

-- First, remove any duplicate entries (keep the highest score per user per difficulty)
WITH ranked_scores AS (
  SELECT 
    id,
    user_id,
    score,
    difficulty,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY user_id, difficulty ORDER BY score DESC, created_at DESC) as rn
  FROM scores
)
DELETE FROM scores 
WHERE id IN (
  SELECT id FROM ranked_scores WHERE rn > 1
);

-- Create a unique index to prevent future duplicates
-- Note: We can't use a unique constraint directly because we want to allow updates
-- Instead, we'll handle this in the application logic

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scores_user_difficulty_score ON scores(user_id, difficulty, score DESC);
CREATE INDEX IF NOT EXISTS idx_scores_difficulty_score_desc ON scores(difficulty, score DESC);

-- Update any NULL difficulty values to 'easy' (if any exist)
UPDATE scores SET difficulty = 'easy' WHERE difficulty IS NULL;
