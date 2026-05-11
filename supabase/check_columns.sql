-- Verificar estructura de trip_invitations
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'trip_invitations';

-- Verificar estructura de trip_members
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'trip_members';
