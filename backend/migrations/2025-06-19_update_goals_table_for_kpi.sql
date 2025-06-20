-- Migration: Update goals table for KPI workflow and metrics JSON
ALTER TABLE goals 
  ADD COLUMN metrics JSON NULL AFTER priority,
  ADD COLUMN deletedAt TIMESTAMP NULL DEFAULT NULL AFTER updatedAt;
