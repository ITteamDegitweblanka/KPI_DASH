// Goal model for MySQL
module.exports = {
  table: `CREATE TABLE IF NOT EXISTS goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assignedToEmployeeId INT,
    setByUserId INT,
    title VARCHAR(255),
    description TEXT,
    targetValue FLOAT,
    currentValue FLOAT,
    unit VARCHAR(50),
    deadline DATE,
    startDate DATE,
    status ENUM('Not Started', 'In Progress', 'Completed') DEFAULT 'Not Started',
    priority ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
    metrics JSON NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletedAt TIMESTAMP NULL DEFAULT NULL
  )`
};
