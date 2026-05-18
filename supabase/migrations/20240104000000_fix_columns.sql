-- Añadir todas las columnas faltantes a trips
ALTER TABLE trips ADD COLUMN IF NOT EXISTS cover_type TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS country_code TEXT;

-- Verificar estructura final
SELECT column_name FROM information_schema.columns WHERE table_name = 'trips';
SELECT column_name FROM information_schema.columns WHERE table_name = 'trip_members';
SELECT column_name FROM information_schema.columns WHERE table_name = 'trip_invitations';
