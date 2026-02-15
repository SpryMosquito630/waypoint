-- ============================================
-- Row Level Security Policies
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Parents can read linked children profiles"
  ON profiles FOR SELECT
  USING (parent_id = auth.uid());

-- Tasks
CREATE POLICY "Players can CRUD own tasks"
  ON tasks FOR ALL
  USING (player_id = auth.uid());

CREATE POLICY "Parents can read children tasks"
  ON tasks FOR SELECT
  USING (
    player_id IN (
      SELECT id FROM profiles WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can create tasks for children"
  ON tasks FOR INSERT
  WITH CHECK (
    player_id IN (
      SELECT id FROM profiles WHERE parent_id = auth.uid()
    )
  );

-- Game State
CREATE POLICY "Players can read own game state"
  ON game_state FOR SELECT
  USING (player_id = auth.uid());

CREATE POLICY "Parents can read children game state"
  ON game_state FOR SELECT
  USING (
    player_id IN (
      SELECT id FROM profiles WHERE parent_id = auth.uid()
    )
  );

-- Rewards
CREATE POLICY "Players can read own rewards"
  ON rewards FOR SELECT
  USING (player_id = auth.uid());

CREATE POLICY "Players can insert own rewards"
  ON rewards FOR INSERT
  WITH CHECK (player_id = auth.uid());

CREATE POLICY "Parents can read children rewards"
  ON rewards FOR SELECT
  USING (
    player_id IN (
      SELECT id FROM profiles WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can update children rewards (claim tickets)"
  ON rewards FOR UPDATE
  USING (
    player_id IN (
      SELECT id FROM profiles WHERE parent_id = auth.uid()
    )
  );

-- Notifications
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (recipient_id = auth.uid());

CREATE POLICY "Users can update own notifications (mark read)"
  ON notifications FOR UPDATE
  USING (recipient_id = auth.uid());
