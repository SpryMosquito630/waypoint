-- ============================================
-- Triggers & Functions
-- ============================================

-- 1. Auto-create profile + game_state on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role, invite_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Player'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'player'),
    substr(md5(random()::text), 1, 6)
  );

  IF COALESCE(NEW.raw_user_meta_data->>'role', 'player') = 'player' THEN
    INSERT INTO public.game_state (player_id) VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 2. Advance vehicle when task is completed
CREATE OR REPLACE FUNCTION on_task_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status = 'pending' THEN
    UPDATE game_state
    SET vehicle_position = vehicle_position + NEW.difficulty,
        total_distance = total_distance + NEW.difficulty,
        updated_at = now()
    WHERE player_id = NEW.player_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_task_complete
  AFTER UPDATE ON tasks
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION on_task_complete();

-- 3. Auto-evolve vehicle when total_distance crosses thresholds
CREATE OR REPLACE FUNCTION check_vehicle_evolution()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.total_distance >= 500 AND OLD.vehicle_level < 50 THEN
    NEW.vehicle_level := 50;
  ELSIF NEW.total_distance >= 100 AND OLD.vehicle_level < 10 THEN
    NEW.vehicle_level := 10;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_vehicle_evolution
  BEFORE UPDATE ON game_state
  FOR EACH ROW
  WHEN (OLD.total_distance IS DISTINCT FROM NEW.total_distance)
  EXECUTE FUNCTION check_vehicle_evolution();

-- 4. Link parent via invite code
CREATE OR REPLACE FUNCTION link_parent(p_invite_code TEXT)
RETURNS VOID AS $$
DECLARE
  v_parent_id UUID;
BEGIN
  SELECT id INTO v_parent_id
  FROM profiles
  WHERE invite_code = p_invite_code AND role = 'parent';

  IF v_parent_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  UPDATE profiles
  SET parent_id = v_parent_id, updated_at = now()
  WHERE id = auth.uid() AND role = 'player';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
