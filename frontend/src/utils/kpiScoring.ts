// Utility to calculate weekly and monthly KPI scores and breakdowns for all teams
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

export type TeamType = 'Sales' | 'Ads' | 'Website Ads' | 'Portfolio Holders';

export interface WeeklyKPIInput {
  employeeName: string;
  team: TeamType;
  sales: number;
  target: number;
  spendEfficiency?: number; // Sales: actual, target
  spendEfficiencyTarget?: number;
  acos?: number;
  acosTarget?: number;
  roas?: number;
  roasTarget?: number;
  aov?: number;
  aovTarget?: number;
  trend?: number; // Portfolio
  trendTarget?: number;
  conversion?: number; // Portfolio
  conversionTarget?: number;
}

export interface WeeklyKPIResult {
  employeeName: string;
  team: TeamType;
  sales: number;
  target: number;
  kpiTotalScore: number;
  kpiBreakdown: Record<string, number>;
  targetMet: boolean;
  status: string; // '✅ Performer of the Week' or ''
}

export function calculateWeeklyKPI(input: WeeklyKPIInput): WeeklyKPIResult {
  const { employeeName, team, sales, target } = input;
  const achievementPercent = target ? (sales / target) * 100 : 0;
  let kpiBreakdown: Record<string, number> = {};
  let kpiTotalScore = 0;

  if (team === 'Sales') {
    kpiBreakdown['Sales'] = getSalesTargetScore(achievementPercent);
    kpiBreakdown['Spend'] = getSellingCostScore(input.spendEfficiency ?? 0, input.spendEfficiencyTarget ?? 0);
    kpiBreakdown['AOV'] = getAOVScore(input.aov ?? 0, input.aovTarget ?? 0);
    kpiTotalScore = kpiBreakdown['Sales'] + kpiBreakdown['Spend'] + kpiBreakdown['AOV'];
  } else if (team === 'Ads') {
    kpiBreakdown['Sales'] = getSalesTargetScore(achievementPercent);
    kpiBreakdown['ACOS'] = getAcosScore(input.acos ?? 0, input.acosTarget ?? 0);
    kpiBreakdown['AOV'] = getAOVScore(input.aov ?? 0, input.aovTarget ?? 0);
    kpiTotalScore = kpiBreakdown['Sales'] + kpiBreakdown['ACOS'] + kpiBreakdown['AOV'];
  } else if (team === 'Website Ads') {
    kpiBreakdown['Sales'] = getSalesTargetScore(achievementPercent);
    kpiBreakdown['ROAS'] = getRoasScore(input.roas ?? 0, input.roasTarget ?? 0);
    kpiBreakdown['AOV'] = getAOVScore(input.aov ?? 0, input.aovTarget ?? 0);
    kpiTotalScore = kpiBreakdown['Sales'] + kpiBreakdown['ROAS'] + kpiBreakdown['AOV'];
  } else if (team === 'Portfolio Holders') {
    kpiBreakdown['Sales'] = getPortfolioSalesScore(achievementPercent);
    kpiBreakdown['Trend'] = getPortfolioTrendScore(input.trend ?? 0);
    kpiBreakdown['CR'] = getPortfolioConversionScore(input.conversion ?? 0, input.conversionTarget ?? 0);
    kpiTotalScore = kpiBreakdown['Sales'] + kpiBreakdown['Trend'] + kpiBreakdown['CR'];
  }

  const targetMet = sales >= target;
  const status = kpiTotalScore === 10 ? '✅ Performer of the Week' : '';

  return {
    employeeName,
    team,
    sales,
    target,
    kpiTotalScore,
    kpiBreakdown,
    targetMet,
    status
  };
}

export interface MonthlyKPIInput {
  employeeName: string;
  team: TeamType;
  weeklyResults: WeeklyKPIResult[];
}

export interface MonthlyKPIResult {
  employeeName: string;
  team: TeamType;
  tenOfTenWeeks: number;
  netSales: number;
  status: string; // '⭐ Star of the Month' or ''
}

export function calculateMonthlyKPI(input: MonthlyKPIInput, allResults: MonthlyKPIResult[]): MonthlyKPIResult {
  const tenOfTenWeeks = input.weeklyResults.filter(w => w.kpiTotalScore === 10).length;
  const netSales = input.weeklyResults.filter(w => w.targetMet).reduce((sum, w) => sum + w.sales, 0);
  // Determine status: most 10/10 weeks, then highest net sales as tiebreaker
  let status = '';
  const maxTenOfTen = Math.max(...allResults.map(r => r.tenOfTenWeeks));
  const topTenOfTen = allResults.filter(r => r.tenOfTenWeeks === maxTenOfTen);
  if (tenOfTenWeeks === maxTenOfTen && topTenOfTen.length === 1) {
    status = '⭐ Star of the Month';
  } else if (tenOfTenWeeks === maxTenOfTen && topTenOfTen.length > 1) {
    const maxNetSales = Math.max(...topTenOfTen.map(r => r.netSales));
    if (netSales === maxNetSales) status = '⭐ Star of the Month';
  }
  return {
    employeeName: input.employeeName,
    team: input.team,
    tenOfTenWeeks,
    netSales,
    status
  };
}
