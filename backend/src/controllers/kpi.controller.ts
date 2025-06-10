import { Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '../utils/prisma';
import { ApiError } from '../utils/error';
import { RequestWithUser } from '../types/request';
import { Role, User } from '@prisma/client';

// Type for team member data
interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string | null;
  title?: string | null;
  role: string;
  teamId: string | null;
}

// Type for performance metrics
interface PerformanceMetric {
  id: string;
  name: string;
  rating: string;
  weight?: number | null;
  comments?: string | null;
}

// Type for performance review data
interface PerformanceReview {
  id: string;
  revieweeId: string;
  reviewerId: string | null;
  reviewDate: Date;
  reviewPeriodStart: Date | null;
  reviewPeriodEnd: Date | null;
  status: string;
  overallRating: string | null;
  strengths: any;
  areasForImprovement: any;
  goalsForNextPeriod: string | null;
  feedback: string | null;
  dueDate: Date | null;
  isFinalized: boolean;
  finalizedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  metrics: PerformanceMetric[];
  reviewee: TeamMember;
  reviewer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

// Type for KPI response
interface KpiResponse {
  success: boolean;
  data: {
    teamId: string;
    teamName: string;
    period: string;
    startDate: string;
    endDate: string;
    overallScore: number;
    totalMembers: number;
    completedReviews: number;
    completionRate: number;
    averageScores: {
      overall: number;
      byCategory: Record<string, number>;
    };
    scoreDistribution: {
      excellent: number;
      good: number;
      average: number;
      poor: number;
    };
    trend: {
      period: string;
      score: number;
    }[];
    members: Array<{
      id: string;
      name: string;
      email: string;
      avatarUrl?: string | null;
      title?: string | null;
      overallScore: number;
      completedReviews: number;
      lastReviewDate: string | null;
    }>;
  };
  message: string;
}

/**
 * Map performance rating to a numerical score (0-100)
 */
const mapRatingToScore = (rating: string): number => {
  const ratingMap: Record<string, number> = {
    'EXCEEDS_EXPECTATIONS': 90,
    'MEETS_EXPECTATIONS': 75,
    'NEEDS_IMPROVEMENT': 50,
    'UNSATISFACTORY': 25,
    'EXCELLENT': 100,
    'GOOD': 75,
    'AVERAGE': 50,
    'POOR': 25,
  };
  return ratingMap[rating] || 0;
};

/**
 * @desc    Get team KPIs
 * @route   GET /api/v1/kpis/team
 * @access  Private
 */
// Remove the duplicate function and keep only one implementation
export const getTeamKpis = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const { period = 'month' } = req.query as { period?: string };
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const userTeamId = req.user?.teamId;

    if (!userId || !userRole) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'User not authenticated');
    }

    // Only admins and leaders can access team KPIs
    if (userRole !== Role.ADMIN && userRole !== Role.LEADER) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Not authorized to access team KPIs');
    }

    // Get team ID from user if not admin
    const teamId = userRole === Role.ADMIN ? req.query.teamId as string : userTeamId;
    if (!teamId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Team ID is required');
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
      default:
        startDate = new Date(0); // Beginning of time
        break;
    }

    // Get team members
    const teamMembers = await prisma.user.findMany({
      where: { teamId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatarUrl: true,
        title: true,
        role: true,
        teamId: true,
      },
    });

    if (teamMembers.length === 0) {
      return res.status(StatusCodes.OK).json({
        success: true,
        data: {
          teamId,
          teamName: 'My Team',
          period,
          startDate: startDate.toISOString(),
          endDate: now.toISOString(),
          overallScore: 0,
          totalMembers: 0,
          completedReviews: 0,
          completionRate: 0,
          averageScores: {
            overall: 0,
            byCategory: {},
          },
          scoreDistribution: {
            excellent: 0,
            good: 0,
            average: 0,
            poor: 0,
          },
          trend: [],
          members: [],
        },
        message: 'No team members found',
      });
    }


    // Get performance reviews for team members
    const reviews = await prisma.performanceReview.findMany({
      where: {
        revieweeId: { in: teamMembers.map(member => member.id) },
        isFinalized: true,
        createdAt: { gte: startDate },
      },
      include: {
        metrics: true,
        reviewee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate KPIs
    const totalMembers = teamMembers.length;
    const completedReviews = reviews.length;
    const completionRate = totalMembers > 0 ? (completedReviews / totalMembers) * 100 : 0;

    // Calculate average scores
    let totalScore = 0;
    const categoryScores: Record<string, { total: number; count: number }> = {};
    const scoreDistribution = {
      excellent: 0,
      good: 0,
      average: 0,
      poor: 0,
    };

    reviews.forEach((review) => {
      const score = review.overallRating ? mapRatingToScore(review.overallRating) : 0;
      totalScore += score;

      // Update score distribution
      if (score >= 90) scoreDistribution.excellent++;
      else if (score >= 75) scoreDistribution.good++;
      else if (score >= 50) scoreDistribution.average++;
      else scoreDistribution.poor++;

      // Update category scores
      review.metrics.forEach((metric) => {
        if (!categoryScores[metric.name]) {
          categoryScores[metric.name] = { total: 0, count: 0 };
        }
        categoryScores[metric.name].total += mapRatingToScore(metric.rating);
        categoryScores[metric.name].count++;
      });
    });

    const overallScore = completedReviews > 0 ? Math.round((totalScore / completedReviews) * 10) / 10 : 0;
    
    // Calculate average scores by category
    const averageScoresByCategory: Record<string, number> = {};
    Object.entries(categoryScores).forEach(([category, { total, count }]) => {
      averageScoresByCategory[category] = count > 0 ? Math.round((total / count) * 10) / 10 : 0;
    });

    // Prepare member data
    const membersData = teamMembers.map((member) => {
      const memberReviews = reviews.filter((r) => r.revieweeId === member.id);
      const memberScore = memberReviews.length > 0
        ? Math.round((memberReviews.reduce((sum, r) => {
            return sum + (r.overallRating ? mapRatingToScore(r.overallRating) : 0);
          }, 0) / memberReviews.length) * 10) / 10
        : 0;

      return {
        id: member.id,
        name: `${member.firstName} ${member.lastName}`,
        email: member.email,
        avatarUrl: member.avatarUrl,
        title: member.title,
        overallScore: memberScore,
        completedReviews: memberReviews.length,
        lastReviewDate: memberReviews[0]?.createdAt.toISOString() || null,
      };
    });

    // Prepare trend data (simplified for example)
    const trend = [
      { period: 'Jan', score: Math.round(Math.random() * 40 + 60) },
      { period: 'Feb', score: Math.round(Math.random() * 40 + 60) },
      { period: 'Mar', score: Math.round(Math.random() * 40 + 60) },
      { period: 'Apr', score: Math.round(Math.random() * 40 + 60) },
      { period: 'May', score: Math.round(Math.random() * 40 + 60) },
      { period: 'Jun', score: Math.round(Math.random() * 40 + 60) },
    ];

    // Prepare response
    const response: KpiResponse = {
      success: true,
      data: {
        teamId,
        teamName: 'My Team', // In a real app, you'd get this from the database
        period,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        overallScore,
        totalMembers,
        completedReviews,
        completionRate: Math.round(completionRate * 10) / 10,
        averageScores: {
          overall: overallScore,
          byCategory: averageScoresByCategory,
        },
        scoreDistribution,
        trend,
        members: membersData,
      },
      message: 'Team KPIs retrieved successfully',
    };

    res.status(StatusCodes.OK).json(response);
  } catch (error) {
    next(error);
  }
};

// Export the controller functions
export default {
  getTeamKpis
};




