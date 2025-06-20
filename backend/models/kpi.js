// KPI model for MySQL
module.exports = {
  table: `CREATE TABLE IF NOT EXISTS kpis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employeeId INT,
    metric VARCHAR(255),
    value FLOAT,
    recordedAt DATE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`
};
