-- Insert test users
INSERT INTO users (displayName, email, password, role) VALUES
  ('Alice Smith', 'alice@example.com', '$2b$10$testhash1', 'Employee'),
  ('Bob Jones', 'bob@example.com', '$2b$10$testhash2', 'Employee');

-- Insert test teams
INSERT INTO teams (name) VALUES
  ('Sales'),
  ('Marketing');

-- Link users to teams (after inserting users, get their IDs)
INSERT INTO user_teams (userId, teamId)
SELECT u.id, t.id FROM users u JOIN teams t ON (u.displayName = 'Alice Smith' AND t.name = 'Sales')
UNION ALL
SELECT u.id, t.id FROM users u JOIN teams t ON (u.displayName = 'Bob Jones' AND t.name = 'Marketing');


