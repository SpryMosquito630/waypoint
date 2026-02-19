-- Allow players to update their own game state (for trading conversions)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'game_state'
      AND policyname = 'Players can update own game state'
  ) THEN
    CREATE POLICY "Players can update own game state"
      ON public.game_state
      FOR UPDATE
      USING (player_id = auth.uid())
      WITH CHECK (player_id = auth.uid());
  END IF;
END $$;
