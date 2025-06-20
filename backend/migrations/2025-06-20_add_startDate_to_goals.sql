-- Migration: Add startDate to goals table
ALTER TABLE goals ADD COLUMN startDate DATE;
