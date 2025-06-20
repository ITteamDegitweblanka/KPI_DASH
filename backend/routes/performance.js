// Example Express route for weekly KPI score trends
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { calculateKPIAndScores } = require('../controllers/goals');

// GET /performance/weekly-chart
router.get('/weekly-chart', async (req, res) => {
  db.query(`
    SELECT 
      WEEK(updatedAt) as week,
      assignedToEmployeeId,
      MAX(JSON_EXTRACT(metrics, '$.total_score')) as total_score
    FROM goals
    WHERE updatedAt >= DATE_SUB(CURDATE(), INTERVAL 8 WEEK)
    GROUP BY week, assignedToEmployeeId
    ORDER BY week ASC
  `, (err, results) => {
    if (err) return res.status(500).json({ message: 'Error fetching weekly chart data', error: err });
    if (!results || results.length === 0) {
      return res.json([]); // Always return valid JSON array
    }
    // Transform to chart-friendly format
    const chartData = {};
    results.forEach(row => {
      const week = `Week ${row.week}`;
      if (!chartData[week]) chartData[week] = { week };
      chartData[week][`emp_${row.assignedToEmployeeId}`] = Number(row.total_score) || 0;
    });
    res.json(Object.values(chartData));
  });
});

// GET /performance/overall
router.get('/overall', (req, res) => {
  // TODO: Implement real aggregation logic for overall performance
  res.json([]);
});

// GET /performance/employees
router.get('/employees', (req, res) => {
  const sql = `
    SELECT 
      u.id as employeeId,
      u.displayName as name,
      u.avatarUrl,
      u.role as title,
      g.metrics,
      g.targetValue,
      g.deadline,
      g.priority,
      g.updatedAt
    FROM users u
    INNER JOIN goals g ON g.assignedToEmployeeId = u.id
      AND g.updatedAt = (
        SELECT MAX(updatedAt) FROM goals g2 WHERE g2.assignedToEmployeeId = u.id
      )
    WHERE u.role IN ('Super Admin', 'Admin', 'Leader', 'Sub-Leader', 'Staff')
    ORDER BY u.displayName ASC
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error('SQL error in /performance/employees:', err);
      return res.status(500).json({ message: 'Error fetching employee performance data', error: err });
    }
    if (!results || results.length === 0) {
      return res.status(404).json({ message: 'No employee performance data found.' });
    }
    // Helper to get ISO week number
    function getISOWeek(date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + 4 - (d.getDay()||7));
      const yearStart = new Date(d.getFullYear(),0,1);
      return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
    }

    // Transform to frontend format
    const data = results.map(row => {
      let metrics = {};
      try {
        metrics = typeof row.metrics === 'string' ? JSON.parse(row.metrics) : (row.metrics || {});
      } catch (e) {
        console.error('Error parsing metrics for employee', row.employeeId, e);
        metrics = {};
      }
      const team = row.team || row.title || '';
      let recalculated = {};
      try {
        recalculated = calculateKPIAndScores(team, metrics);
      } catch (e) {
        console.error('Error in calculateKPIAndScores for employee', row.employeeId, e);
        recalculated = {};
      }
      // Attach week and month for grouping
      const week = row.updatedAt ? getISOWeek(row.updatedAt) : null;
      const month = row.updatedAt ? (new Date(row.updatedAt).getMonth() + 1) : null;
      return {
        employee: {
          id: row.employeeId,
          name: row.name,
          avatarUrl: row.avatarUrl,
          team: row.team,
          title: row.title
        },
        target: row.targetValue || 0,
        targetAchievedPercentage: recalculated.sales_achievement_percent || 0,
        totalScore: recalculated.total_score || 0,
        week,
        month,
        metrics: recalculated,
        deadline: row.deadline,
        priority: row.priority,
        updatedAt: row.updatedAt
      };
    });

    // Find Performer of the Week
    const weekGroups = {};
    data.forEach(item => {
      if (!item.week) return;
      if (!weekGroups[item.week]) weekGroups[item.week] = [];
      weekGroups[item.week].push(item);
    });
    Object.values(weekGroups).forEach(group => {
      let top = group.reduce((a, b) => (b.totalScore > a.totalScore ? b : a), group[0]);
      if (top && top.employee) top.employee.isPerformerOfTheWeek = true;
    });

    // Find Star of the Month
    const monthGroups = {};
    data.forEach(item => {
      if (!item.month) return;
      if (!monthGroups[item.month]) monthGroups[item.month] = [];
      monthGroups[item.month].push(item);
    });
    Object.values(monthGroups).forEach(group => {
      let top = group.reduce((a, b) => (b.totalScore > a.totalScore ? b : a), group[0]);
      if (top && top.employee) top.employee.isStarOfTheMonth = true;
    });

    console.log('Performance API response:', JSON.stringify(data, null, 2));
    res.json(data);
  });
});

module.exports = router;
