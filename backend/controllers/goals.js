const db = require('../config/db');
const notificationsController = require('./notifications');

// Helper: parse metrics if stringified (for update)
function parseIfString(val) {
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return val; }
  }
  return val;
}

// Helper to extract the main target value from metrics based on team
function extractTargetValue(team, metrics) {
  switch (team) {
    case 'Sales':
      return parseFloat(metrics.weekly_sales_target || 0);
    case 'Ads':
      return parseFloat(metrics.weekly_sales_target || 0);
    case 'Website Ads':
      return parseFloat(metrics.weekly_sales_target || 0);
    case 'Portfolio Holders':
      return parseFloat(metrics.weekly_sales_target || 0);
    default:
      return 0;
  }
}

// Helper to normalize team names for calculation
function normalizeTeamName(team) {
  if (!team) return '';
  const t = team.toLowerCase();
  if (t.includes('sales')) return 'Sales';
  if (t.includes('ads') && !t.includes('website')) return 'Ads';
  if (t.includes('website')) return 'Website Ads';
  if (t.includes('portfolio')) return 'Portfolio Holders';
  return team;
}

const calculateKPIAndScores = (team, metrics) => {
  // Clone metrics to avoid mutation
  const result = { ...metrics };
  try {
    switch (team) {
      case 'Sales': {
        const salesTarget = parseFloat(metrics.weekly_sales_target || 0);
        const sales = parseFloat(metrics.weekly_sales || 0);
        const spend = parseFloat(metrics.weekly_spend || 0);
        const costTarget = parseFloat(metrics.target_cost_percent || 0);
        const aovTarget = parseFloat(metrics.aov_target || 0);
        const aov = parseFloat(metrics.aov || 0);
        result.sales_achievement_percent = salesTarget ? (sales / salesTarget) * 100 : null;
        result.cost_percent = sales ? (spend / sales) * 100 : null;
        result.aov_achievement_percent = aovTarget ? (aov / aovTarget) * 100 : null;
        // --- Business scoring logic ---
        // Sales Target Score (0–4)
        if (result.sales_achievement_percent >= 100) result.sales_score = 4;
        else if (result.sales_achievement_percent >= 80) result.sales_score = 3;
        else if (result.sales_achievement_percent >= 60) result.sales_score = 2;
        else if (result.sales_achievement_percent >= 40) result.sales_score = 1;
        else result.sales_score = 0;
        // Spend Score (0–3)
        if (result.cost_percent <= costTarget) result.cost_score = 3;
        else if (result.cost_percent <= costTarget + 10) result.cost_score = 2;
        else if (result.cost_percent <= costTarget + 20) result.cost_score = 1;
        else result.cost_score = 0;
        // AOV Score (0–3)
        if (result.aov_achievement_percent >= 100) result.aov_score = 3;
        else if (result.aov_achievement_percent >= 90) result.aov_score = 2;
        else if (result.aov_achievement_percent >= 80) result.aov_score = 1;
        else result.aov_score = 0;
        result.total_score = result.sales_score + result.cost_score + result.aov_score;
        result.isPerformerOfTheWeek = (result.total_score === 10);
        break;
      }
      case 'Ads': {
        const salesTarget = parseFloat(metrics.weekly_sales_target || 0);
        const sales = parseFloat(metrics.weekly_sales || 0);
        const acosTarget = parseFloat(metrics.target_acos_percent || 0);
        const acos = parseFloat(metrics.weekly_acos_percent || 0);
        const aovTarget = parseFloat(metrics.aov_target || 0);
        const aov = parseFloat(metrics.aov || 0);
        result.sales_achievement_percent = salesTarget ? (sales / salesTarget) * 100 : null;
        result.aov_achievement_percent = aovTarget ? (aov / aovTarget) * 100 : null;
        // --- Business scoring logic ---
        // Sales Target Score (0–4)
        if (result.sales_achievement_percent >= 100) result.sales_score = 4;
        else if (result.sales_achievement_percent >= 80) result.sales_score = 3;
        else if (result.sales_achievement_percent >= 60) result.sales_score = 2;
        else if (result.sales_achievement_percent >= 40) result.sales_score = 1;
        else result.sales_score = 0;
        // ACOS Score (0–3)
        const acos_diff_pct = acosTarget ? ((acos - acosTarget) / acosTarget) * 100 : null;
        if (acos_diff_pct !== null) {
          if (acos_diff_pct <= 0) result.acos_score = 3;
          else if (acos_diff_pct <= 10) result.acos_score = 2;
          else if (acos_diff_pct <= 20) result.acos_score = 1;
          else result.acos_score = 0;
        } else {
          result.acos_score = 0;
        }
        // AOV Score (0–3)
        if (result.aov_achievement_percent >= 100) result.aov_score = 3;
        else if (result.aov_achievement_percent >= 90) result.aov_score = 2;
        else if (result.aov_achievement_percent >= 80) result.aov_score = 1;
        else result.aov_score = 0;
        result.total_score = result.sales_score + result.acos_score + result.aov_score;
        result.isPerformerOfTheWeek = (result.total_score === 10);
        break;
      }
      case 'Website Ads': {
        const salesTarget = parseFloat(metrics.weekly_sales_target || 0);
        const sales = parseFloat(metrics.weekly_sales || 0);
        const roasTarget = parseFloat(metrics.target_roas || 0);
        const roas = parseFloat(metrics.weekly_roas || 0);
        const aovTarget = parseFloat(metrics.aov_target || 0);
        const aov = parseFloat(metrics.aov || 0);
        result.sales_achievement_percent = salesTarget ? (sales / salesTarget) * 100 : null;
        result.aov_achievement_percent = aovTarget ? (aov / aovTarget) * 100 : null;
        // --- Business scoring logic ---
        // Sales Target Score (0–4)
        if (result.sales_achievement_percent >= 100) result.sales_score = 4;
        else if (result.sales_achievement_percent >= 80) result.sales_score = 3;
        else if (result.sales_achievement_percent >= 60) result.sales_score = 2;
        else if (result.sales_achievement_percent >= 40) result.sales_score = 1;
        else result.sales_score = 0;
        // ROAS Score (0–3)
        const roas_diff_pct = roasTarget ? ((roas - roasTarget) / roasTarget) * 100 : null;
        if (roas_diff_pct !== null) {
          if (roas_diff_pct >= 0) result.roas_score = 3;
          else if (roas_diff_pct >= -10) result.roas_score = 2;
          else if (roas_diff_pct >= -20) result.roas_score = 1;
          else result.roas_score = 0;
        } else {
          result.roas_score = 0;
        }
        // AOV Score (0–3)
        if (result.aov_achievement_percent >= 100) result.aov_score = 3;
        else if (result.aov_achievement_percent >= 90) result.aov_score = 2;
        else if (result.aov_achievement_percent >= 80) result.aov_score = 1;
        else result.aov_score = 0;
        result.total_score = result.sales_score + result.roas_score + result.aov_score;
        result.isPerformerOfTheWeek = (result.total_score === 10);
        break;
      }
      case 'Portfolio Holders': {
        const salesTarget = parseFloat(metrics.weekly_sales_target || 0);
        const sales = parseFloat(metrics.weekly_sales || 0);
        const lastWeekSales = parseFloat(metrics.last_week_sales || 0);
        const thisWeekSales = parseFloat(metrics.this_week_sales || 0);
        const convTarget = parseFloat(metrics.conversion_target || 0);
        const conv = parseFloat(metrics.conversion_rate || 0);
        result.sales_achievement_percent = salesTarget ? (sales / salesTarget) * 100 : null;
        result.trend_percent = lastWeekSales ? ((thisWeekSales - lastWeekSales) / lastWeekSales) * 100 : null;
        // --- Business scoring logic ---
        // Sales Score (0–5)
        if (result.sales_achievement_percent >= 100) result.sales_score = 5;
        else if (result.sales_achievement_percent >= 80) result.sales_score = 4;
        else if (result.sales_achievement_percent >= 60) result.sales_score = 3;
        else if (result.sales_achievement_percent >= 40) result.sales_score = 2;
        else if (result.sales_achievement_percent >= 20) result.sales_score = 1;
        else result.sales_score = 0;
        // Trend Score (0–3)
        if (result.trend_percent > 0) result.trend_score = 3;
        else if (result.trend_percent === 0) result.trend_score = 2;
        else if (result.trend_percent >= -10) result.trend_score = 1;
        else result.trend_score = 0;
        // Conversion Rate Score (0–2)
        const cr_pct = convTarget ? (conv / convTarget) * 100 : null;
        if (cr_pct !== null) {
          if (cr_pct >= 100) result.conversion_score = 2;
          else if (cr_pct >= 90) result.conversion_score = 1;
          else result.conversion_score = 0;
        } else {
          result.conversion_score = 0;
        }
        result.total_score = result.sales_score + result.trend_score + result.conversion_score;
        result.isPerformerOfTheWeek = (result.total_score === 10);
        break;
      }
      default:
        break;
    }
  } catch (e) {
    // If calculation fails, just return raw metrics
    return metrics;
  }
  return result;
};

// Export the calculation function for use in other modules
exports.calculateKPIAndScores = calculateKPIAndScores;

exports.getAll = (req, res) => {
  db.query('SELECT * FROM goals', (err, results) => {
    if (err) return res.status(500).json({ message: 'Error fetching goals', error: err });
    // Parse metrics JSON for each result
    const parsed = results.map(goal => ({
      ...goal,
      metrics: parseIfString(goal.metrics)
    }));
    res.json(parsed);
  });
};

exports.getById = (req, res) => {
  db.query('SELECT * FROM goals WHERE id = ?', [req.params.id], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ message: 'Goal not found' });
    const goal = results[0];
    goal.metrics = parseIfString(goal.metrics);
    res.json(goal);
  });
};

exports.create = (req, res) => {
  const { assignedToEmployeeId, setByUserId, title, description, currentValue, unit, deadline, status, priority, metrics } = req.body;
  const safeCurrentValue = currentValue !== undefined ? currentValue : 0;
  const safeUnit = unit || '$';
  const safeStatus = status || 'Active';
  const safePriority = priority || 'Medium';
  const teamRaw = (metrics && metrics.team) || req.body.team || title || '';
  const team = normalizeTeamName(teamRaw);
  const metricsObj = parseIfString(metrics);
  const calculatedMetrics = calculateKPIAndScores(team, metricsObj || {});
  const targetValue = extractTargetValue(team, metricsObj || {});
  console.log('[GOALS][CREATE] Team:', team);
  console.log('[GOALS][CREATE] Raw metrics:', metricsObj);
  console.log('[GOALS][CREATE] Calculated metrics:', calculatedMetrics);
  db.query('INSERT INTO goals (assignedToEmployeeId, setByUserId, title, description, targetValue, currentValue, unit, startDate, deadline, status, priority, metrics) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [assignedToEmployeeId, setByUserId, title, description, targetValue, safeCurrentValue, safeUnit, req.body.startDate, deadline, safeStatus, safePriority, JSON.stringify(calculatedMetrics)],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Error creating goal', error: err });
      // Trigger notification for goal assignment
      db.query('INSERT INTO notifications (userId, type, message) VALUES (?, ?, ?)', [assignedToEmployeeId, 'new_target', `A new goal has been assigned: ${title}`], (nErr) => {
        if (nErr) console.error('Failed to create notification:', nErr);
      });
      res.status(201).json({ id: result.insertId });
    });
};

exports.update = (req, res) => {
  const id = req.params.id;
  db.query('SELECT * FROM goals WHERE id=?', [id], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ message: 'Goal not found' });
    const existing = results[0];
    // Parse and merge metrics: keep targets, update achievements
    let oldMetrics = {};
    try { oldMetrics = typeof existing.metrics === 'string' ? JSON.parse(existing.metrics) : (existing.metrics || {}); } catch { oldMetrics = {}; }
    let newMetrics = {};
    try { newMetrics = typeof req.body.metrics === 'string' ? JSON.parse(req.body.metrics) : (req.body.metrics || {}); } catch { newMetrics = {}; }
    // Merge: targets from old, achievements from new
    const mergedMetrics = { ...oldMetrics, ...newMetrics };
    // Only update fields that are present in req.body, otherwise keep existing
    const {
      title = existing.title,
      description = existing.description,
      currentValue = existing.currentValue !== undefined ? existing.currentValue : 0,
      unit = existing.unit || '$',
      deadline = existing.deadline,
      status = existing.status || 'Active',
      priority = existing.priority || 'Medium'
    } = req.body;
    // Calculate metrics as before
    const teamRaw = (mergedMetrics && mergedMetrics.team) || req.body.team || title || '';
    const team = normalizeTeamName(teamRaw);
    const calculatedMetrics = calculateKPIAndScores(team, mergedMetrics);
    const targetValue = extractTargetValue(team, mergedMetrics);
    console.log('[GOALS][UPDATE] Team:', team);
    console.log('[GOALS][UPDATE] Merged metrics:', mergedMetrics);
    console.log('[GOALS][UPDATE] Calculated metrics:', calculatedMetrics);
    db.query(
      'UPDATE goals SET title=?, description=?, targetValue=?, currentValue=?, unit=?, startDate=?, deadline=?, status=?, priority=?, metrics=? WHERE id=?',
      [title, description, targetValue, currentValue !== undefined ? currentValue : 0, unit || '$', req.body.startDate || existing.startDate, deadline, status || 'Active', priority || 'Medium', JSON.stringify(calculatedMetrics), id],
      (err, result) => {
        if (err) return res.status(500).json({ message: 'Error updating goal', error: err });
        // Trigger notification for goal update
        db.query('INSERT INTO notifications (userId, type, message) VALUES (?, ?, ?)', [existing.assignedToEmployeeId, 'goal_updated', `Your goal has been updated: ${title}`], (nErr) => {
          if (nErr) console.error('Failed to create notification:', nErr);
        });
        res.json({ message: 'Goal updated' });
      }
    );
  });
};

exports.delete = (req, res) => {
  db.query('DELETE FROM goals WHERE id=?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Error deleting goal', error: err });
    res.json({ message: 'Goal deleted' });
  });
};

// Get all goals for a specific employee
exports.getGoalsByEmployeeId = (req, res) => {
  const employeeId = req.params.employeeId;
  db.query('SELECT * FROM goals WHERE assignedToEmployeeId = ?', [employeeId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error fetching employee goals', error: err });
    res.json({ success: true, data: results });
  });
};
