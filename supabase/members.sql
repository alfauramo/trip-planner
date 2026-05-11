-- Tabla de miembros del viaje
CREATE TABLE trip_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE
);

-- Tabla de invitaciones pendientes (para usuarios sin cuenta)
CREATE TABLE trip_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  invited_by UUID REFERENCES auth.users(id),
  role TEXT NOT NULL DEFAULT 'viewer',
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_invitations ENABLE ROW LEVEL SECURITY;

-- Policies para trip_members
CREATE POLICY "Miembros pueden ver sus viajes"
  ON trip_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM trip_invitations ti WHERE ti.email = trip_members.email AND ti.status = 'pending')
  );

CREATE POLICY "Owner puede gestionar miembros"
  ON trip_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM trip_members tm
      WHERE tm.trip_id = trip_members.trip_id
      AND tm.user_id = auth.uid()
      AND tm.role = 'owner'
    )
  );

-- Policies para trip_invitations
CREATE POLICY "Invitaciones visibles para el owner"
  ON trip_invitations FOR SELECT
  USING (
    invited_by = auth.uid()
    OR email = auth.jwt() ->> 'email'
  );

CREATE POLICY "Owner puede crear invitaciones"
  ON trip_invitations FOR INSERT
  WITH CHECK (invited_by = auth.uid());

CREATE POLICY "Invitado puede aceptar"
  ON trip_invitations FOR UPDATE
  USING (email = auth.jwt() ->> 'email');

-- Index
CREATE INDEX idx_trip_members_trip_id ON trip_members(trip_id);
CREATE INDEX idx_trip_members_user_id ON trip_members(user_id);
CREATE INDEX idx_trip_invitations_token ON trip_invitations(token);
CREATE INDEX idx_trip_invitations_email ON trip_invitations(email);
