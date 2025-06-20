// User model for MySQL
// This is a helper for SQL table structure reference
module.exports = {
  table: `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    displayName VARCHAR(255),
    role ENUM('Super Admin', 'Admin', 'Leader', 'Sub-Leader', 'Staff') DEFAULT 'Staff',
    avatarUrl VARCHAR(255),
    avatar LONGBLOB,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`
};
