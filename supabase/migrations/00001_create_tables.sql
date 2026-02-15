-- ============================================
-- Quest Drive MVP - Database Schema
-- ============================================

-- 1. Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('player', 'parent')) DEFAULT 'player',
  avatar_url TEXT,
  parent_id UUID REFERENCES public.profiles(id),
  invite_code TEXT UNIQUE,
  timezone TEXT DEFAULT 'America/New_York',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tasks
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  deadline TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'expired')) DEFAULT 'pending',
  difficulty INT NOT NULL CHECK (difficulty BETWEEN 1 AND 3) DEFAULT 1,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tasks_player_status ON tasks(player_id, status);
CREATE INDEX idx_tasks_deadline ON tasks(deadline) WHERE status = 'pending';

-- 3. Game State (one row per player)
CREATE TABLE public.game_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vehicle_position INT NOT NULL DEFAULT 0,
  storm_position INT NOT NULL DEFAULT 0,
  vehicle_level INT NOT NULL DEFAULT 1,
  total_distance INT NOT NULL DEFAULT 0,
  current_streak INT NOT NULL DEFAULT 0,
  week_start_position INT NOT NULL DEFAULT 0,
  scrap_count INT NOT NULL DEFAULT 0,
  boost_count INT NOT NULL DEFAULT 0,
  last_storm_tick TIMESTAMPTZ DEFAULT now(),
  daily_task_count INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Rewards (loot log)
CREATE TABLE public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('scrap', 'boost', 'irl_ticket')),
  tile_index INT NOT NULL,
  metadata JSONB DEFAULT '{}',
  claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id),
  notification_type TEXT NOT NULL CHECK (notification_type IN ('storm_warning', 'zap', 'milestone', 'reward')),
  channel TEXT NOT NULL CHECK (channel IN ('in_app', 'sms', 'push')),
  payload JSONB NOT NULL DEFAULT '{}',
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Realtime for game_state
ALTER PUBLICATION supabase_realtime ADD TABLE game_state;
