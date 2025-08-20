-- Create the users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the scores table
CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  score INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a policy to allow anonymous read access to scores for the leaderboard
CREATE POLICY "Enable read access for all users" ON scores FOR SELECT USING (TRUE);
CREATE POLICY "Enable read access for all users" ON users FOR SELECT USING (TRUE);

-- Create a policy to allow authenticated users to insert their scores
CREATE POLICY "Enable insert for authenticated users" ON scores FOR INSERT WITH CHECK (auth.uid() = user_id);
