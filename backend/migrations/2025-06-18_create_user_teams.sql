-- Migration: Create user_teams join table for many-to-many user/team assignments
CREATE TABLE IF NOT EXISTS user_teams (
  userId INT NOT NULL,
  teamId INT NOT NULL,
  PRIMARY KEY (userId, teamId),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE CASCADE
);
