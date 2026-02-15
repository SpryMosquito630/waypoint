-- ============================================
-- Storm Advancement & Notification Cron Jobs
-- Requires pg_cron and pg_net extensions
-- ============================================

-- Enable extensions (may already be enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 1. Advance storm every 15 minutes
SELECT cron.schedule(
  'advance-storm',
  '*/15 * * * *',
  $$
    UPDATE game_state
    SET storm_position = storm_position + GREATEST(1, ROUND((1 + daily_task_count * 0.5) * 0.25)),
        last_storm_tick = now(),
        updated_at = now();
  $$
);

-- 2. Recalculate daily task count at midnight
SELECT cron.schedule(
  'recalculate-daily-tasks',
  '0 0 * * *',
  $$
    UPDATE game_state gs
    SET daily_task_count = (
      SELECT COUNT(*)
      FROM tasks t
      WHERE t.player_id = gs.player_id
        AND t.status = 'pending'
        AND t.deadline >= CURRENT_DATE
        AND t.deadline < CURRENT_DATE + interval '1 day'
    ),
    updated_at = now();
  $$
);

-- 3. Check for zap conditions every 15 minutes (after storm advances)
SELECT cron.schedule(
  'check-zap',
  '1,16,31,46 * * * *',
  $$
    -- Zap notifications for caught players
    INSERT INTO notifications (recipient_id, notification_type, channel, payload)
    SELECT
      gs.player_id,
      'zap',
      'sms',
      jsonb_build_object(
        'message', p.display_name || ' has been caught by the storm in Quest Drive!',
        'vehicle_pos', gs.vehicle_position,
        'storm_pos', gs.storm_position
      )
    FROM game_state gs
    JOIN profiles p ON p.id = gs.player_id
    WHERE gs.storm_position >= gs.vehicle_position
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.recipient_id = gs.player_id
          AND n.notification_type = 'zap'
          AND n.created_at > now() - interval '1 hour'
      );

    -- Warning notifications to parents when gap <= 3
    INSERT INTO notifications (recipient_id, notification_type, channel, payload)
    SELECT
      p.parent_id,
      'storm_warning',
      'sms',
      jsonb_build_object(
        'message', p.display_name || '''s vehicle is only ' || (gs.vehicle_position - gs.storm_position) || ' tiles ahead of the storm!',
        'gap', gs.vehicle_position - gs.storm_position
      )
    FROM game_state gs
    JOIN profiles p ON p.id = gs.player_id
    WHERE p.parent_id IS NOT NULL
      AND (gs.vehicle_position - gs.storm_position) <= 3
      AND gs.vehicle_position > gs.storm_position
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.recipient_id = p.parent_id
          AND n.notification_type = 'storm_warning'
          AND n.created_at > now() - interval '2 hours'
      );
  $$
);

-- 4. Trigger to send SMS via Edge Function when notification is inserted
CREATE OR REPLACE FUNCTION notify_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.channel = 'sms' AND NEW.sent_at IS NULL THEN
    PERFORM net.http_post(
      url := current_setting('app.supabase_url', true) || '/functions/v1/send-alert',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true),
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('record', row_to_json(NEW))
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notification_send
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_insert();
