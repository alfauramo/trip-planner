-- Trip Planner Database Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Trips table
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  cover_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Days table
CREATE TABLE days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  day_number INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Places table
CREATE TABLE places (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_id UUID NOT NULL REFERENCES days(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  notes TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) policies

-- Enable RLS on all tables
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE days ENABLE ROW LEVEL SECURITY;
ALTER TABLE places ENABLE ROW LEVEL SECURITY;

-- Trips policies
CREATE POLICY "Users can view their own trips"
  ON trips FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trips"
  ON trips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trips"
  ON trips FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trips"
  ON trips FOR DELETE
  USING (auth.uid() = user_id);

-- Days policies
CREATE POLICY "Users can view days of their own trips"
  ON days FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = days.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert days into their own trips"
  ON days FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = days.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update days in their own trips"
  ON days FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = days.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete days from their own trips"
  ON days FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = days.trip_id
      AND trips.user_id = auth.uid()
    )
  );

-- Places policies
CREATE POLICY "Users can view places in their own trip days"
  ON places FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM days
      JOIN trips ON trips.id = days.trip_id
      WHERE days.id = places.day_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert places into their own trip days"
  ON places FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM days
      JOIN trips ON trips.id = days.trip_id
      WHERE days.id = places.day_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update places in their own trip days"
  ON places FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM days
      JOIN trips ON trips.id = days.trip_id
      WHERE days.id = places.day_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete places from their own trip days"
  ON places FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM days
      JOIN trips ON trips.id = days.trip_id
      WHERE days.id = places.day_id
      AND trips.user_id = auth.uid()
    )
  );

-- Indexes for better performance
CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_days_trip_id ON days(trip_id);
CREATE INDEX idx_places_day_id ON places(day_id);
CREATE INDEX idx_places_order ON places(day_id, "order");
