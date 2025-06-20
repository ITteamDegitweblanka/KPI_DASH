// Scoring functions for Sales, Ads, Website Ads, Portfolio Holders teams

// --- Sales Team ---
export function getSalesTargetScore(achievementPercent: number): number {
  if (achievementPercent >= 100) return 4;
  if (achievementPercent >= 80) return 3;
  if (achievementPercent >= 60) return 2;
  if (achievementPercent >= 40) return 1;
  return 0;
}

export function getSellingCostScore(actual: number, target: number): number {
  const diff = ((actual - target) / target) * 100;
  if (diff <= 0) return 3;
  if (diff <= 10) return 2;
  if (diff <= 20) return 1;
  return 0;
}

export function getAOVScore(actual: number, target: number): number {
  const diff = ((actual - target) / target) * 100;
  if (diff >= 0) return 3;
  if (diff >= -10) return 2;
  if (diff >= -20) return 1;
  return 0;
}

// --- Ads Team (ACOS) ---
export function getAcosScore(actual: number, target: number): number {
  const diff = ((actual - target) / target) * 100;
  if (diff <= 0) return 3;
  if (diff <= 10) return 2;
  if (diff <= 20) return 1;
  return 0;
}

// --- Website Ads Team (ROAS) ---
export function getRoasScore(actual: number, target: number): number {
  const diff = ((actual - target) / target) * 100;
  if (diff >= 0) return 3;
  if (diff >= -10) return 2;
  if (diff >= -20) return 1;
  return 0;
}

// --- Portfolio Holders Team ---
export function getPortfolioSalesScore(achievementPercent: number): number {
  if (achievementPercent >= 100) return 5;
  if (achievementPercent >= 80) return 4;
  if (achievementPercent >= 60) return 3;
  if (achievementPercent >= 40) return 2;
  if (achievementPercent >= 20) return 1;
  return 0;
}

export function getPortfolioTrendScore(trendPercent: number): number {
  if (trendPercent > 0) return 3;
  if (trendPercent === 0) return 2;
  if (trendPercent >= -10) return 1;
  return 0;
}

export function getPortfolioConversionScore(actual: number, target: number): number {
  const diff = ((actual - target) / target) * 100;
  if (diff >= 0) return 2;
  if (diff >= -10) return 1;
  return 0;
}

// Unified scoring function for all team types
export function calculateKpiScore(teamType: string, raw: any) {
  let sales_score = 0, cost_score = 0, acos_score = 0, roas_score = 0, aov_score = 0, trend_score = 0, conversion_score = 0, total_score = 0;

  // Sales Target Score (common)
  const sales_achievement_pct = (raw.weekly_sales / raw.weekly_sales_target) * 100;
  if (teamType === 'PH') {
    sales_score = getPortfolioSalesScore(sales_achievement_pct);
  } else {
    sales_score = getSalesTargetScore(sales_achievement_pct);
  }

  if (teamType === 'Sales') {
    const spend_percent = (raw.weekly_spend / raw.weekly_sales) * 100;
    cost_score = getSellingCostScore(spend_percent, Number(raw.target_cost_percent));
    aov_score = getAOVScore(raw.aov, raw.aov_target);
    total_score = sales_score + cost_score + aov_score;
  } else if (teamType === 'Ads') {
    acos_score = getAcosScore(raw.weekly_acos_percent, raw.target_acos_percent);
    aov_score = getAOVScore(raw.aov, raw.aov_target);
    total_score = sales_score + acos_score + aov_score;
  } else if (teamType === 'Website Ads') {
    roas_score = getRoasScore(raw.weekly_roas, raw.target_roas);
    aov_score = getAOVScore(raw.aov, raw.aov_target);
    total_score = sales_score + roas_score + aov_score;
  } else if (teamType === 'PH') {
    const sales_trend_pct = ((raw.this_week_sales - raw.last_week_sales) / raw.last_week_sales) * 100;
    trend_score = getPortfolioTrendScore(sales_trend_pct);
    conversion_score = getPortfolioConversionScore(raw.conversion_rate, raw.conversion_target);
    total_score = sales_score + trend_score + conversion_score;
  }

  return { sales_score, cost_score, acos_score, roas_score, aov_score, trend_score, conversion_score, total_score };
}
