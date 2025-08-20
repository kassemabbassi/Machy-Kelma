-- Add difficulty column to scores table
ALTER TABLE scores ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'easy';

-- Create index for better performance when querying by difficulty
CREATE INDEX IF NOT EXISTS idx_scores_difficulty ON scores(difficulty);
CREATE INDEX IF NOT EXISTS idx_scores_difficulty_score ON scores(difficulty, score DESC);

-- Update existing records to have a default difficulty (optional)
UPDATE scores SET difficulty = 'easy' WHERE difficulty IS NULL;
