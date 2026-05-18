-- Create event_comments table
CREATE TABLE IF NOT EXISTS event_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE event_comments ENABLE ROW LEVEL SECURITY;

-- Policies: only trip members can read/write
CREATE POLICY "event_comments_select" ON event_comments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM events e
    JOIN days d ON d.id = e.day_id
    JOIN trips t ON t.id = d.trip_id
    LEFT JOIN trip_members tm ON tm.trip_id = t.id AND tm.user_id = auth.uid()
    WHERE e.id = event_comments.event_id
    AND (t.user_id = auth.uid() OR tm.user_id = auth.uid())
  )
);

CREATE POLICY "event_comments_insert" ON event_comments FOR INSERT WITH CHECK (
  auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM events e
    JOIN days d ON d.id = e.day_id
    JOIN trips t ON t.id = d.trip_id
    LEFT JOIN trip_members tm ON tm.trip_id = t.id AND tm.user_id = auth.uid()
    WHERE e.id = event_comments.event_id
    AND (t.user_id = auth.uid() OR tm.user_id = auth.uid())
  )
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_event_comments_event_id ON event_comments(event_id);
CREATE INDEX IF NOT EXISTS idx_event_comments_created_at ON event_comments(created_at);
