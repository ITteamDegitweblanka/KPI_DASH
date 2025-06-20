-- Add a JSON column to store team-specific metrics for each goal
ALTER TABLE goals ADD COLUMN metrics JSON NULL AFTER priority;
