# Database Migrations

Convention: Supabase-style timestamped migrations.

## Applied Order

1. `20240101000000_initial_schema.sql` - Core tables: trips, days, events, attachments, profiles, notifications, todo_items, trip_activities, packing_items
2. `20240102000000_enhanced_schema.sql` - RLS policies, triggers, indexes, edge function setup
3. `20240103000000_members_and_invitations.sql` - trip_members, trip_invitations tables and policies
4. `20240104000000_fix_columns.sql` - Column fixes, constraints, cleanup

## How to Apply a New Migration

Create a new file in this directory named `<timestamp>_<description>.sql`.
Apply it via Supabase Dashboard SQL editor or the Supabase CLI.
