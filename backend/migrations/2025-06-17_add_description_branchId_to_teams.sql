-- Migration: Add description and branchId to teams table
ALTER TABLE teams ADD COLUMN description VARCHAR(255) NULL;
ALTER TABLE teams ADD COLUMN branchId INT NULL;
