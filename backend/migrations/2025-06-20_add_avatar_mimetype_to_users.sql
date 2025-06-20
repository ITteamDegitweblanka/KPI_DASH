-- Migration: Add avatarMimeType column to users table for correct avatar serving
ALTER TABLE users ADD COLUMN avatarMimeType VARCHAR(64) NULL AFTER avatar;
