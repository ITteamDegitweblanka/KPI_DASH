// recalculate_goal_metrics.js
// Run this script with: node recalculate_goal_metrics.js

const db = require('./config/db');
const { calculateKPIAndScores } = require('./controllers/goals');

async function recalculateAllGoals() {
  db.query('SELECT * FROM goals', async (err, results) => {
    if (err) {
      console.error('Error fetching goals:', err);
      process.exit(1);
    }
    let updated = 0;
    for (const goal of results) {
      let metrics = {};
      try {
        metrics = typeof goal.metrics === 'string' ? JSON.parse(goal.metrics) : (goal.metrics || {});
      } catch (e) {
        console.warn(`Invalid metrics for goal id ${goal.id}, skipping.`);
        continue;
      }
      // Try to get team from metrics, title, or fallback
      const team = metrics.team || goal.team || goal.title || '';
      const recalculated = calculateKPIAndScores(team, metrics);
      await new Promise((resolve, reject) => {
        db.query(
          'UPDATE goals SET metrics=? WHERE id=?',
          [JSON.stringify(recalculated), goal.id],
          (err) => {
            if (err) {
              console.error(`Failed to update goal id ${goal.id}:`, err);
              reject(err);
            } else {
              updated++;
              resolve();
            }
          }
        );
      });
    }
    console.log(`Recalculated and updated metrics for ${updated} goals.`);
    process.exit(0);
  });
}

recalculateAllGoals();
