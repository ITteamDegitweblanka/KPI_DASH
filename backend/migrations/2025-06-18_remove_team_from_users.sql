-- Migration: Remove 'team' column from users table
ALTER TABLE users DROP COLUMN IF EXISTS team;
