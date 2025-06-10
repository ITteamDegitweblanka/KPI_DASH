import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../utils/api-error';
import { prisma } from '../utils/prisma';
import { UserRole } from '../types';
import { PerformanceRating as PrismaPerformanceRating, Prisma } from '@prisma/client';
import { asyncHandler } from '../middleware/error.middleware';

// Alias Prisma's PerformanceRating for local use
type PerformanceRating = PrismaPerformanceRating;

// Define interfaces
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string | null;
  title?: string | null;
  role: UserRole;
  teamId?: string | null;
}

interface PerformanceReview {
  id: string;
  revieweeId: string;
  reviewerId: string | null;
  overallRating: PerformanceRating | null;
  strengths: string | null;
  areasForImprovement: string | null;
  goalsForNextPeriod: string | null;
  feedback: string | null;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  reviewPeriodStart: Date | null;
  reviewPeriodEnd: Date | null;
  reviewDate: Date | null;
  dueDate: Date | null;
  isFinalized: boolean;
  finalizedAt: Date | null;
  metrics?: Array<{
    id: string;
    name: string;
    description: string | null;
    rating: PerformanceRating;
    weight: number;
    comments: string | null;
    reviewId: string;
  }>;
  reviewee: User;
  reviewer?: User | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Team {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  teamId?: string | null;
}

interface TeamMember extends Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'avatarUrl' | 'title'> {
  totalReviews: number;
  averageScore: number;
  lastReview: Date | null;
  status: 'REVIEWED' | 'PENDING';
}

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Helper function to map rating to numerical score
 * @param rating - The rating value (string or PerformanceRating)
 */
function mapRatingToScore(rating: PerformanceRating | null): number {
  if (!rating) return 0;
  
  switch (rating) {
    case 'EXCEEDS_EXPECTATIONS':
      return 90;
    case 'MEETS_EXPECTATIONS':
      return 75;
    case 'NEEDS_IMPROVEMENT':
      return 60;
    case 'UNSATISFACTORY':
      return 40;
    default:
      return 0;
  }
}

/**
 * Get performance metrics for an employee
 * @route GET /api/v1/performance/employee/:employeeId
 * @access Private
 */
export const getEmployeePerformance = async (req: AuthenticatedRequest, res: Response) => {
  const { employeeId } = req.params;
  const { status, limit = '10', page = '1' } = req.query;
  const pageNumber = parseInt(page as string, 10) || 1;
  const pageSize = parseInt(limit as string, 10) || 10;
  const skip = (pageNumber - 1) * pageSize;

  try {
    // Check if the requesting user has permission to view these reviews
    if (req.user?.id !== employeeId && 
        req.user?.role !== UserRole.ADMIN && 
        req.user?.role !== UserRole.SUPER_ADMIN) {
      
      // If not an admin, check if the user is the reviewee's manager or team lead
      const reviewee = await prisma.user.findUnique({
        where: { id: employeeId },
        select: { teamId: true }
      });

      if (reviewee?.teamId) {
        const team = await prisma.team.findUnique({
          where: { id: reviewee.teamId },
          select: { leaderId: true }
        });

        if (!team || team.leaderId !== req.user?.id) {
          throw new ApiError(
            StatusCodes.FORBIDDEN,
            'You do not have permission to view these performance reviews'
          );
        }
      } else {
        throw new ApiError(
          StatusCodes.FORBIDDEN,
          'You do not have permission to view these performance reviews'
        );
      }
    }

    const where: Prisma.PerformanceReviewWhereInput = { 
      revieweeId: employeeId
    };
    
    // Status filtering is not available in the current schema
    // All reviews will be returned
    if (status) {
      console.warn('Status filtering is not supported in the current schema');
    }

    // Define the review type for better type safety
    type ReviewWithRelations = Prisma.PromiseReturnType<typeof prisma.performanceReview.findFirst> & {
      reviewee: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'avatarUrl' | 'title'>;
      reviewer: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'> | null;
    };

    // Execute queries in parallel
    const [reviews, totalCount] = await Promise.all([
      prisma.performanceReview.findMany({
        where,
        include: {
          reviewee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
              title: true
            }
          },
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
              title: true
            }
          },
          metrics: true
        },
        orderBy: { reviewDate: 'desc' as const },
        skip,
        take: pageSize,
      }),
      prisma.performanceReview.count({ where })
    ]);

    // Calculate metrics
    let totalScore = 0;
    let reviewCount = 0;

    reviews.forEach((review) => {
      if (review.overallRating) {
        totalScore += mapRatingToScore(review.overallRating);
        reviewCount++;
      }
    });

    const avgScore = reviewCount > 0 ? totalScore / reviewCount : 0;
    
    // Since we don't have status in the schema, we'll just use all reviews
    const filteredReviews = reviews;

    // Prepare response
    const responseData = {
      employeeId,
      metrics: {
        averageScore: Math.round(avgScore * 10) / 10,
        reviewCount,
        lastReviewDate: reviews[0]?.createdAt || null
      },
      reviews: {
        items: filteredReviews,
        pagination: {
          total: totalCount,
          page: pageNumber,
          pageSize,
          totalPages: Math.ceil(totalCount / pageSize)
        }
      }
    };

    res.status(StatusCodes.OK).json({
      success: true,
      data: responseData
    });
  } catch (error: unknown) {
    console.error('Error in getEmployeePerformance:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to fetch employee performance data',
      true,
      [{ message: errorMessage }]
    );
  }
};

/**
 * Create a new performance review
 * @route POST /api/v1/performance/reviews
 * @access Private (Admin, Manager)
 */
export const createPerformanceReview = async (req: AuthenticatedRequest, res: Response) => {
  const {
    revieweeId,
    reviewerId,
    overallRating,
    strengths,
    areasForImprovement,
    goalsForNextPeriod,
    feedback,
    status,
    reviewPeriodStart,
    reviewPeriodEnd,
    dueDate
  } = req.body;

  try {
    // Check permissions - only admins and managers can create reviews
    if (req.user?.role !== UserRole.ADMIN && req.user?.role !== UserRole.SUPER_ADMIN) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        'You do not have permission to create performance reviews'
      );
    }

    // Check if reviewee exists
    const reviewee = await prisma.user.findUnique({
      where: { id: revieweeId },
      select: { id: true }
    });

    if (!reviewee) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Employee not found');
    }

    // Check if reviewer exists
    if (reviewerId) {
      const reviewer = await prisma.user.findUnique({
        where: { id: reviewerId },
        select: { id: true }
      });

      if (!reviewer) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Reviewer not found');
      }
    }

    // Create the performance review with the correct field names from the Prisma schema
    const review = await prisma.performanceReview.create({
      data: {
        revieweeId,
        reviewerId: reviewerId || null,
        reviewDate: new Date(),
        reviewPeriodStart: reviewPeriodStart ? new Date(reviewPeriodStart) : null,
        reviewPeriodEnd: reviewPeriodEnd ? new Date(reviewPeriodEnd) : null,
        status: (status as 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED') || 'DRAFT',
        overallRating: overallRating as PerformanceRating || null,
        strengths: strengths || null,
        areasForImprovement: areasForImprovement || null,
        goalsForNextPeriod: goalsForNextPeriod || null,
        feedback: feedback || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        isFinalized: false,
      },
      include: {
        reviewee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            title: true
          }
        },
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: review
    });
  } catch (error: unknown) {
    console.error('Error in createPerformanceReview:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to create performance review',
      true,
      [{ message: errorMessage }]
    );
  }
};

/**
 * Update a performance review
 * @route PUT /api/v1/performance/reviews/:id
 * @access Private (Admin, Manager, Reviewer)
 */
export const updatePerformanceReview = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const {
    revieweeId,
    reviewerId,
    overallRating,
    strengths,
    areasForImprovement,
    goalsForNextPeriod,
    feedback,
    status,
    reviewPeriodStart,
    reviewPeriodEnd,
    dueDate,
    isFinalized
  } = req.body;

  try {
    // Check if review exists
    const existingReview = await prisma.performanceReview.findUnique({
      where: { id },
      select: {
        id: true,
        reviewerId: true,
        revieweeId: true,
      }
    });

    if (!existingReview) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Performance review not found');
    }

    // Only admin or the reviewer can update the review
    if (
      req.user?.role !== UserRole.ADMIN &&
      req.user?.role !== UserRole.SUPER_ADMIN &&
      existingReview.reviewerId !== req.user?.id
    ) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        'You are not authorized to update this review'
      );
    }

    // Only update allowed fields with proper typing
    const updatePayload: {
      revieweeId?: string;
      reviewerId?: string | null;
      reviewPeriodStart?: Date | null;
      reviewPeriodEnd?: Date | null;
      status?: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
      overallRating?: PerformanceRating | null;
      strengths?: string | null;
      areasForImprovement?: string | null;
      goalsForNextPeriod?: string | null;
      feedback?: string | null;
      dueDate?: Date | null;
      isFinalized?: boolean;
      finalizedAt?: Date | null;
      updatedAt: Date;
    } = {
      updatedAt: new Date()
    };

    // Map and validate fields from request body
    if (req.body.reviewPeriodStart !== undefined) {
      updatePayload.reviewPeriodStart = req.body.reviewPeriodStart ? new Date(req.body.reviewPeriodStart) : null;
    }
    if (req.body.reviewPeriodEnd !== undefined) {
      updatePayload.reviewPeriodEnd = req.body.reviewPeriodEnd ? new Date(req.body.reviewPeriodEnd) : null;
    }
    if (req.body.status !== undefined) {
      updatePayload.status = req.body.status;
    }
    if (req.body.overallRating !== undefined) {
      updatePayload.overallRating = req.body.overallRating as PerformanceRating || null;
    }
    if (req.body.strengths !== undefined) {
      updatePayload.strengths = req.body.strengths || null;
    }
    if (req.body.areasForImprovement !== undefined) {
      updatePayload.areasForImprovement = req.body.areasForImprovement || null;
    }
    if (req.body.goalsForNextPeriod !== undefined) {
      updatePayload.goalsForNextPeriod = req.body.goalsForNextPeriod || null;
    }
    if (req.body.feedback !== undefined) {
      updatePayload.feedback = req.body.feedback || null;
    }
    if (req.body.dueDate !== undefined) {
      updatePayload.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
    }
    if (req.body.isFinalized !== undefined) {
      updatePayload.isFinalized = Boolean(req.body.isFinalized);
      if (req.body.isFinalized) {
        updatePayload.finalizedAt = new Date();
      }
    }
    updatePayload.updatedAt = new Date();
    if (revieweeId) {
      updatePayload.revieweeId = revieweeId;
    }
    if (reviewerId) {
      updatePayload.reviewerId = reviewerId;
    }
    if (reviewPeriodStart) {
      updatePayload.reviewPeriodStart = new Date(reviewPeriodStart);
    }
    if (reviewPeriodEnd) {
      updatePayload.reviewPeriodEnd = new Date(reviewPeriodEnd);
    }
    if (dueDate) {
      updatePayload.dueDate = new Date(dueDate);
    }
    if (isFinalized) {
      updatePayload.isFinalized = true;
      updatePayload.finalizedAt = new Date();
    }

    const updatedReview = await prisma.performanceReview.update({
      where: { id },
      data: updatePayload,
      include: {
        reviewee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            title: true
          }
        },
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: updatedReview
    });
  } catch (error: unknown) {
    console.error('Error updating performance review:', error);
    const prismaError = error as { code?: string };
    if (prismaError.code === 'P2025') {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        'Performance review not found',
        true
      );
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to update performance review',
      true,
      [errorMessage]
    );
  }
}

/**
 * Get performance metrics for a team
 * @route GET /api/v1/performance/team/:teamId
 * @access Private (Team Lead, Manager, Admin)
 */
export const getTeamPerformance = async (req: AuthenticatedRequest, res: Response) => {
  const { teamId } = req.params;
  const { period = 'current' } = req.query;

  try {
    // Verify the requesting user has permission to view team performance
    if (req.user?.role !== UserRole.ADMIN && req.user?.role !== UserRole.SUPER_ADMIN) {
      // For non-admins, check if they're the team lead
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: { leaderId: true },
      });

      if (!team || team.leaderId !== req.user?.id) {
        throw new ApiError(
          StatusCodes.FORBIDDEN,
          'You do not have permission to view performance data for this team'
        );
      }
    }

    // Get all active team members
    const teamMembers = await prisma.user.findMany({
      where: {
        teamId,
        isActive: true, // Only include active users
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatarUrl: true,
        title: true,
      },
    }) as TeamMember[];

    if (teamMembers.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'No active team members found for this team',
      });
    }

    const memberIds = teamMembers.map((member) => member.id);

    // Define the review type using Prisma's generated type
    type ReviewData = {
      id: string;
      revieweeId: string;
      overallRating: PrismaPerformanceRating | null;
      reviewDate: Date | null;
      finalizedAt: Date | null;
    };

    // Get performance reviews for all team members
    const reviews: ReviewData[] = await prisma.performanceReview.findMany({
      where: {
        revieweeId: { in: memberIds },
        isFinalized: true, // Only include finalized reviews
      },
      select: {
        id: true,
        revieweeId: true,
        overallRating: true,
        reviewDate: true,
        finalizedAt: true,
      },
    });

    const memberPerformance: TeamMember[] = teamMembers.map((member) => {
      const memberReviews = reviews.filter((review: { revieweeId: string }) => review.revieweeId === member.id);
      const totalScore = memberReviews.reduce((sum: number, review: { overallRating: PerformanceRating | null }) => {
        return sum + (review.overallRating ? mapRatingToScore(review.overallRating) : 0);
      }, 0);
      const averageScore = memberReviews.length > 0 ? Math.round(totalScore / memberReviews.length) : 0;
      const status: 'REVIEWED' | 'PENDING' = memberReviews.length > 0 ? 'REVIEWED' : 'PENDING';
      const lastReview = memberReviews.length > 0 ? memberReviews[0].reviewDate : null;

      return {
        ...member,
        totalReviews: memberReviews.length,
        averageScore,
        lastReview,
        status
      } as TeamMember;
    });

    // Sort members by average score (highest first)
    memberPerformance.sort((a: { averageScore: number }, b: { averageScore: number }) => b.averageScore - a.averageScore);

    // Calculate metrics for the team
    const totalScore = memberPerformance.reduce((sum: number, member: { averageScore: number }) => {
      return sum + member.averageScore;
    }, 0);
    const avgScore = memberPerformance.length > 0 ? Math.round(totalScore / memberPerformance.length) : 0;
    const totalReviews = reviews.length;

    // Prepare response data
    const responseData = {
      teamId,
      metrics: {
        averageScore: Math.round(avgScore * 10) / 10,
        totalMembers: teamMembers.length,
        totalReviews,
        activeReviews: totalReviews,
        activeRate: totalReviews > 0 ? 100 : 0
      },
      members: memberPerformance,
      period: period as string,
      membersWithReviews: memberPerformance.filter(m => m.totalReviews > 0).length
    };

    res.status(StatusCodes.OK).json({
      success: true,
      data: responseData
    });
  } catch (error: unknown) {
    console.error('Error getting team performance:', error);
    if (error instanceof ApiError) {
      throw error;
    } else if (error instanceof Error) {
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to get team performance data'
      );
    } else {
      const apiError = new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to get team performance data'
      );
      (apiError as any).message = `${apiError.message}: Unknown error`;
      throw apiError;
    }
  }
};

/**
 * Get all employee performance data
 * @route GET /api/v1/performance/employees
 * @access Private (Admin)
 */
export const getAllEmployeePerformance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // First, get all active users with their basic info
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Then, get performance reviews for all users in a single query
    const performanceReviews = await prisma.performanceReview.findMany({
      where: {
        revieweeId: {
          in: users.map(user => user.id)
        }
      },
      select: {
        id: true,
        revieweeId: true,
        overallRating: true,
        reviewDate: true,
        metrics: true
      },
      orderBy: {
        reviewDate: 'desc'
      }
    });

    // Group reviews by user ID
    interface ReviewType {
      id: string;
      revieweeId: string;
      overallRating: PerformanceRating | null;
      reviewDate: Date | null;
      metrics?: any;
    }
    
    const reviewsByUser = performanceReviews.reduce<Record<string, ReviewType[]>>(
      (acc: Record<string, ReviewType[]>, review: ReviewType) => {
        if (!acc[review.revieweeId]) {
          acc[review.revieweeId] = [];
        }
        acc[review.revieweeId].push(review);
        return acc;
      }, 
      {}
    );

    // Map users with their latest review
    const employeePerformance = users.map(user => {
      const userReviews = reviewsByUser[user.id] || [];
      const latestReview = userReviews[0] || null;
      
      return {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        team: user.team,
        lastReview: latestReview?.reviewDate || null,
        overallRating: latestReview?.overallRating || null,
        metrics: latestReview?.metrics || {}
      };
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: employeePerformance
    });
  } catch (error: unknown) {
    console.error('Error in getAllEmployeePerformance:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to fetch all employee performance data',
      true,
      [{ message: errorMessage }]
    );
  }
};

// Define interface for weekly performance data
interface WeeklyPerformanceData {
  week: string;
  score: number;
}

// Weekly performance data
export const getWeeklyPerformanceData = async (req: Request, res: Response): Promise<Response> => {
  // Return mock weekly data structure expected by frontend
  const weeklyData: WeeklyPerformanceData[] = [
    { week: '2024-06-01', score: 80 },
    { week: '2024-06-08', score: 85 },
    { week: '2024-06-15', score: 90 }
  ];
  return res.json(weeklyData);
};

// Define interface for overall performance data
interface TeamPerformanceData {
  team_name: string;
  avg_score: number;
}

export const getOverallPerformanceData = async (req: Request, res: Response): Promise<Response> => {
  // Return mock overall data structure expected by frontend
  const teamPerformance: TeamPerformanceData[] = [
    { team_name: 'Engineering', avg_score: 88 },
    { team_name: 'Sales', avg_score: 75 }
  ];
  return res.json(teamPerformance);
};

/**
 * Delete a performance review
 * @route DELETE /api/v1/performance/reviews/:id
 * @access Private (Admin)
 */
export const deletePerformanceReview = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    // Check if review exists
    const existingReview = await prisma.performanceReview.findUnique({
      where: { id }
    });

    if (!existingReview) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Performance review not found');
    }

    // Delete the review
    await prisma.performanceReview.delete({
      where: { id }
    });

    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error: unknown) {
    console.error('Error deleting performance review:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to delete performance review',
      true,
      [errorMessage]
    );
  }
};

/**
 * Finalize a performance review
 * @route POST /api/v1/performance/reviews/:id/finalize
 * @access Private (Admin, Manager, Reviewer)
 */
export const finalizePerformanceReview = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { comments } = req.body;

  try {
    // Check if review exists
    const existingReview = await prisma.performanceReview.findUnique({
      where: { id },
      select: {
        id: true,
        isFinalized: true,
        reviewerId: true
      }
    });

    if (!existingReview) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Performance review not found');
    }

    // Check if review is already finalized
    if (existingReview.isFinalized) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Performance review is already finalized');
    }

    // Check if user is authorized to finalize
    if (
      req.user?.role !== UserRole.ADMIN &&
      req.user?.role !== UserRole.SUPER_ADMIN &&
      existingReview.reviewerId !== req.user?.id
    ) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        'You are not authorized to finalize this review'
      );
    }

    // Update the review
    const updatedReview = await prisma.performanceReview.update({
      where: { id },
      data: {
        isFinalized: true,
        finalizedAt: new Date(),
        status: 'COMPLETED' as const
      },
      include: {
        reviewee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: updatedReview
    });
  } catch (error: unknown) {
    console.error('Error finalizing performance review:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to finalize performance review',
      true,
      [errorMessage]
    );
  }
};

// Export all controller methods
const performanceController = {
  getEmployeePerformance,
  createPerformanceReview,
  updatePerformanceReview,
  getTeamPerformance,
  getAllEmployeePerformance,
  mapRatingToScore,
  getWeeklyPerformanceData,
  getOverallPerformanceData,
  deletePerformanceReview,
  finalizePerformanceReview
};

export default performanceController;
