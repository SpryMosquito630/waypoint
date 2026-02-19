-- Add coin balance and award coins on task completion
ALTER TABLE public.game_state
  ADD COLUMN IF NOT EXISTS coin_count INT NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION on_task_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status = 'pending' THEN
    UPDATE game_state
    SET vehicle_position = vehicle_position + NEW.difficulty,
        total_distance = total_distance + NEW.difficulty,
        coin_count = coin_count + CASE NEW.difficulty
          WHEN 1 THEN 100
          WHEN 2 THEN 250
          WHEN 3 THEN 500
          ELSE 0
        END,
        updated_at = now()
    WHERE player_id = NEW.player_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
