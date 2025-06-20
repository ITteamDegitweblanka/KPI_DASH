-- Migration: Add location and employeeCount columns to branches table
ALTER TABLE branches
  ADD COLUMN location VARCHAR(255) DEFAULT NULL,
  ADD COLUMN employeeCount INT DEFAULT 0;
