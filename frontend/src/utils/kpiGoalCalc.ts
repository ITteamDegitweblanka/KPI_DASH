import {
  getSalesTargetScore,
  getSellingCostScore,
  getAOVScore,
  getAcosScore,
  getRoasScore,
  getPortfolioSalesScore,
  getPortfolioTrendScore,
  getPortfolioConversionScore
} from './goalScoring';

export function calculateKPIForGoal(
  team: string,
  metrics: Record<string, any>
): { totalScore: number; breakdown: Record<string, number> } {
  let breakdown: Record<string, number> = {};
  let totalScore = 0;
  const percent = (ach: any, tgt: any) => tgt ? (parseFloat(ach) / parseFloat(tgt)) * 100 : 0;

  if (team === 'Sales') {
    breakdown['Sales'] = getSalesTargetScore(percent(metrics['Weekly Achievement (Sales)'], metrics['Weekly Target (Sales)']));
    breakdown['Spend'] = getSellingCostScore(
      parseFloat(metrics['Weekly Achievement (Selling Cost %)'] || 0),
      parseFloat(metrics['Weekly Target (Selling Cost %)'] || 0)
    );
    breakdown['AOV'] = getAOVScore(
      parseFloat(metrics['Weekly Achievement (AOV)'] || 0),
      parseFloat(metrics['Weekly Target (AOV)'] || 0)
    );
    totalScore = breakdown['Sales'] + breakdown['Spend'] + breakdown['AOV'];
  } else if (team === 'Ads') {
    breakdown['Sales'] = getSalesTargetScore(percent(metrics['Weekly Achievement (Sales)'], metrics['Weekly Target (Sales)']));
    breakdown['ACOS'] = getAcosScore(
      parseFloat(metrics['Weekly Achievement (Sales Trend %)'] || 0),
      parseFloat(metrics['Weekly Target (Sales Trend %)'] || 0)
    );
    breakdown['AOV'] = getAOVScore(
      parseFloat(metrics['Weekly Achievement (AOV)'] || 0),
      parseFloat(metrics['Weekly Target (AOV)'] || 0)
    );
    totalScore = breakdown['Sales'] + breakdown['ACOS'] + breakdown['AOV'];
  } else if (team === 'Website Ads') {
    breakdown['Sales'] = getSalesTargetScore(percent(metrics['Weekly Achievement (Sales)'], metrics['Weekly Target (Sales)']));
    breakdown['ROAS'] = getRoasScore(
      parseFloat(metrics['Weekly Achievement (ROAS %)'] || 0),
      parseFloat(metrics['Weekly Target (ROAS %)'] || 0)
    );
    breakdown['AOV'] = getAOVScore(
      parseFloat(metrics['Weekly Achievement (AOV)'] || 0),
      parseFloat(metrics['Weekly Target (AOV)'] || 0)
    );
    totalScore = breakdown['Sales'] + breakdown['ROAS'] + breakdown['AOV'];
  } else if (team === 'Portfolio Holders') {
    breakdown['Sales'] = getPortfolioSalesScore(percent(metrics['Weekly Achievement (Sales)'], metrics['Weekly Target (Sales)']));
    breakdown['Trend'] = getPortfolioTrendScore(
      parseFloat(metrics['Weekly Achievement (Sales Trend %)'] || 0)
    );
    breakdown['CR'] = getPortfolioConversionScore(
      parseFloat(metrics['Weekly Achievement (Conversion Rate %)'] || 0),
      parseFloat(metrics['Weekly Target (Conversion Rate %)'] || 0)
    );
    totalScore = breakdown['Sales'] + breakdown['Trend'] + breakdown['CR'];
  }
  return { totalScore, breakdown };
}

export interface KPIResultDetail {
  score: number;
  achieved: number;
  target: number;
  percent: number;
  maxPoints: number;
}

export interface EnhancedKPIResult {
  totalScore: number;
  breakdown: Record<string, KPIResultDetail>;
  performerOfTheWeek: boolean;
  warnings?: string[];
}

export function calculateEnhancedKPI(team: string, metrics: Record<string, any>): EnhancedKPIResult {
  const breakdown: Record<string, KPIResultDetail> = {};
  let totalScore = 0;
  const warnings: string[] = [];

  if (team === 'Sales') {
    // Sales Target
    const achieved = Number(metrics['Weekly Achievement (Sales)'] || 0);
    const target = Number(metrics['Weekly Target (Sales)'] || 0);
    const percent = target ? (achieved / target) * 100 : 0;
    const score = getSalesTargetScore(percent);
    breakdown['Sales'] = { score, achieved, target, percent, maxPoints: 4 };
    totalScore += score;
    if (!metrics['Weekly Achievement (Sales)'] || !metrics['Weekly Target (Sales)']) {
      warnings.push('Missing sales achievement or target');
    }
    // Spend Efficiency
    const spendAch = Number(metrics['Weekly Achievement (Selling Cost %)'] || 0);
    const spendTarget = Number(metrics['Weekly Target (Selling Cost %)'] || 0);
    const spendScore = getSellingCostScore(spendAch, spendTarget);
    breakdown['Spend'] = { score: spendScore, achieved: spendAch, target: spendTarget, percent: spendTarget ? (spendAch / spendTarget) * 100 : 0, maxPoints: 3 };
    totalScore += spendScore;
    if (!metrics['Weekly Achievement (Selling Cost %)'] || !metrics['Weekly Target (Selling Cost %)']) {
      warnings.push('Missing spend efficiency achievement or target');
    }
    // AOV
    const aovAch = Number(metrics['Weekly Achievement (AOV)'] || 0);
    const aovTarget = Number(metrics['Weekly Target (AOV)'] || 0);
    const aovScore = getAOVScore(aovAch, aovTarget);
    breakdown['AOV'] = { score: aovScore, achieved: aovAch, target: aovTarget, percent: aovTarget ? (aovAch / aovTarget) * 100 : 0, maxPoints: 3 };
    totalScore += aovScore;
    if (!metrics['Weekly Achievement (AOV)'] || !metrics['Weekly Target (AOV)']) {
      warnings.push('Missing AOV achievement or target');
    }
  } else if (team === 'Ads') {
    // Sales Target
    const achieved = Number(metrics['Weekly Achievement (Sales)'] || 0);
    const target = Number(metrics['Weekly Target (Sales)'] || 0);
    const percent = target ? (achieved / target) * 100 : 0;
    const score = getSalesTargetScore(percent);
    breakdown['Sales'] = { score, achieved, target, percent, maxPoints: 4 };
    totalScore += score;
    if (!metrics['Weekly Achievement (Sales)'] || !metrics['Weekly Target (Sales)']) {
      warnings.push('Missing sales achievement or target');
    }
    // ACOS Efficiency
    const acosAch = Number(metrics['Weekly Achievement (Sales Trend %)'] || 0);
    const acosTarget = Number(metrics['Weekly Target (Sales Trend %)'] || 0);
    const acosScore = getAcosScore(acosAch, acosTarget);
    breakdown['ACOS'] = { score: acosScore, achieved: acosAch, target: acosTarget, percent: acosTarget ? (acosAch / acosTarget) * 100 : 0, maxPoints: 3 };
    totalScore += acosScore;
    if (!metrics['Weekly Achievement (Sales Trend %)'] || !metrics['Weekly Target (Sales Trend %)']) {
      warnings.push('Missing ACOS achievement or target');
    }
    // AOV
    const aovAch = Number(metrics['Weekly Achievement (AOV)'] || 0);
    const aovTarget = Number(metrics['Weekly Target (AOV)'] || 0);
    const aovScore = getAOVScore(aovAch, aovTarget);
    breakdown['AOV'] = { score: aovScore, achieved: aovAch, target: aovTarget, percent: aovTarget ? (aovAch / aovTarget) * 100 : 0, maxPoints: 3 };
    totalScore += aovScore;
    if (!metrics['Weekly Achievement (AOV)'] || !metrics['Weekly Target (AOV)']) {
      warnings.push('Missing AOV achievement or target');
    }
  } else if (team === 'Website Ads') {
    // Sales Target
    const achieved = Number(metrics['Weekly Achievement (Sales)'] || 0);
    const target = Number(metrics['Weekly Target (Sales)'] || 0);
    const percent = target ? (achieved / target) * 100 : 0;
    const score = getSalesTargetScore(percent);
    breakdown['Sales'] = { score, achieved, target, percent, maxPoints: 4 };
    totalScore += score;
    if (!metrics['Weekly Achievement (Sales)'] || !metrics['Weekly Target (Sales)']) {
      warnings.push('Missing sales achievement or target');
    }
    // ROAS Efficiency
    const roasAch = Number(metrics['Weekly Achievement (ROAS %)'] || 0);
    const roasTarget = Number(metrics['Weekly Target (ROAS %)'] || 0);
    const roasScore = getRoasScore(roasAch, roasTarget);
    breakdown['ROAS'] = { score: roasScore, achieved: roasAch, target: roasTarget, percent: roasTarget ? (roasAch / roasTarget) * 100 : 0, maxPoints: 3 };
    totalScore += roasScore;
    if (!metrics['Weekly Achievement (ROAS %)'] || !metrics['Weekly Target (ROAS %)']) {
      warnings.push('Missing ROAS achievement or target');
    }
    // AOV
    const aovAch = Number(metrics['Weekly Achievement (AOV)'] || 0);
    const aovTarget = Number(metrics['Weekly Target (AOV)'] || 0);
    const aovScore = getAOVScore(aovAch, aovTarget);
    breakdown['AOV'] = { score: aovScore, achieved: aovAch, target: aovTarget, percent: aovTarget ? (aovAch / aovTarget) * 100 : 0, maxPoints: 3 };
    totalScore += aovScore;
    if (!metrics['Weekly Achievement (AOV)'] || !metrics['Weekly Target (AOV)']) {
      warnings.push('Missing AOV achievement or target');
    }
  } else if (team === 'Portfolio Holders') {
    // Sales Target
    const achieved = Number(metrics['Weekly Achievement (Sales)'] || 0);
    const target = Number(metrics['Weekly Target (Sales)'] || 0);
    const percent = target ? (achieved / target) * 100 : 0;
    const score = getPortfolioSalesScore(percent);
    breakdown['Sales'] = { score, achieved, target, percent, maxPoints: 5 };
    totalScore += score;
    if (!metrics['Weekly Achievement (Sales)'] || !metrics['Weekly Target (Sales)']) {
      warnings.push('Missing sales achievement or target');
    }
    // Sales Growth Trend
    const trendAch = Number(metrics['Weekly Achievement (Sales Trend %)'] || 0);
    const trendScore = getPortfolioTrendScore(trendAch);
    breakdown['Trend'] = { score: trendScore, achieved: trendAch, target: 0, percent: trendAch, maxPoints: 3 };
    totalScore += trendScore;
    if (!metrics['Weekly Achievement (Sales Trend %)']) {
      warnings.push('Missing sales trend achievement');
    }
    // Conversion Rate
    const crAch = Number(metrics['Weekly Achievement (Conversion Rate %)'] || 0);
    const crTarget = Number(metrics['Weekly Target (Conversion Rate %)'] || 0);
    const crScore = getPortfolioConversionScore(crAch, crTarget);
    breakdown['CR'] = { score: crScore, achieved: crAch, target: crTarget, percent: crTarget ? (crAch / crTarget) * 100 : 0, maxPoints: 2 };
    totalScore += crScore;
    if (!metrics['Weekly Achievement (Conversion Rate %)'] || !metrics['Weekly Target (Conversion Rate %)']) {
      warnings.push('Missing conversion rate achievement or target');
    }
  }

  return {
    totalScore,
    breakdown,
    performerOfTheWeek: totalScore === 10,
    warnings: warnings.length ? warnings : undefined,
  };
}
