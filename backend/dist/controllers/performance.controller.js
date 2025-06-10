"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.finalizePerformanceReview = exports.deletePerformanceReview = exports.getOverallPerformanceData = exports.getWeeklyPerformanceData = exports.getAllEmployeePerformance = exports.getTeamPerformance = exports.updatePerformanceReview = exports.createPerformanceReview = exports.getEmployeePerformance = void 0;
const http_status_codes_1 = require("http-status-codes");
const api_error_1 = require("../utils/api-error");
const prisma_1 = require("../utils/prisma");
const types_1 = require("../types");
/**
 * Helper function to map rating to numerical score
 * @param rating - The rating value (string or PerformanceRating)
 */
function mapRatingToScore(rating) {
    if (!rating)
        return 0;
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
const getEmployeePerformance = async (req, res) => {
    const { employeeId } = req.params;
    const { status, limit = '10', page = '1' } = req.query;
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 10;
    const skip = (pageNumber - 1) * pageSize;
    try {
        // Check if the requesting user has permission to view these reviews
        if (req.user?.id !== employeeId &&
            req.user?.role !== types_1.UserRole.ADMIN &&
            req.user?.role !== types_1.UserRole.SUPER_ADMIN) {
            // If not an admin, check if the user is the reviewee's manager or team lead
            const reviewee = await prisma_1.prisma.user.findUnique({
                where: { id: employeeId },
                select: { teamId: true }
            });
            if (reviewee?.teamId) {
                const team = await prisma_1.prisma.team.findUnique({
                    where: { id: reviewee.teamId },
                    select: { leaderId: true }
                });
                if (!team || team.leaderId !== req.user?.id) {
                    throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.FORBIDDEN, 'You do not have permission to view these performance reviews');
                }
            }
            else {
                throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.FORBIDDEN, 'You do not have permission to view these performance reviews');
            }
        }
        const where = {
            revieweeId: employeeId
        };
        // Status filtering is not available in the current schema
        // All reviews will be returned
        if (status) {
            console.warn('Status filtering is not supported in the current schema');
        }
        // Execute queries in parallel
        const [reviews, totalCount] = await Promise.all([
            prisma_1.prisma.performanceReview.findMany({
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
                orderBy: { reviewDate: 'desc' },
                skip,
                take: pageSize,
            }),
            prisma_1.prisma.performanceReview.count({ where })
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
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: responseData
        });
    }
    catch (error) {
        console.error('Error in getEmployeePerformance:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch employee performance data', true, [{ message: errorMessage }]);
    }
};
exports.getEmployeePerformance = getEmployeePerformance;
/**
 * Create a new performance review
 * @route POST /api/v1/performance/reviews
 * @access Private (Admin, Manager)
 */
const createPerformanceReview = async (req, res) => {
    const { revieweeId, reviewerId, overallRating, strengths, areasForImprovement, goalsForNextPeriod, feedback, status, reviewPeriodStart, reviewPeriodEnd, dueDate } = req.body;
    try {
        // Check permissions - only admins and managers can create reviews
        if (req.user?.role !== types_1.UserRole.ADMIN && req.user?.role !== types_1.UserRole.SUPER_ADMIN) {
            throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.FORBIDDEN, 'You do not have permission to create performance reviews');
        }
        // Check if reviewee exists
        const reviewee = await prisma_1.prisma.user.findUnique({
            where: { id: revieweeId },
            select: { id: true }
        });
        if (!reviewee) {
            throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Employee not found');
        }
        // Check if reviewer exists
        if (reviewerId) {
            const reviewer = await prisma_1.prisma.user.findUnique({
                where: { id: reviewerId },
                select: { id: true }
            });
            if (!reviewer) {
                throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Reviewer not found');
            }
        }
        // Create the performance review with the correct field names from the Prisma schema
        const review = await prisma_1.prisma.performanceReview.create({
            data: {
                revieweeId,
                reviewerId: reviewerId || null,
                reviewDate: new Date(),
                reviewPeriodStart: reviewPeriodStart ? new Date(reviewPeriodStart) : null,
                reviewPeriodEnd: reviewPeriodEnd ? new Date(reviewPeriodEnd) : null,
                status: status || 'DRAFT',
                overallRating: overallRating || null,
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
        res.status(http_status_codes_1.StatusCodes.CREATED).json({
            success: true,
            data: review
        });
    }
    catch (error) {
        console.error('Error in createPerformanceReview:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to create performance review', true, [{ message: errorMessage }]);
    }
};
exports.createPerformanceReview = createPerformanceReview;
/**
 * Update a performance review
 * @route PUT /api/v1/performance/reviews/:id
 * @access Private (Admin, Manager, Reviewer)
 */
const updatePerformanceReview = async (req, res) => {
    const { id } = req.params;
    const { revieweeId, reviewerId, overallRating, strengths, areasForImprovement, goalsForNextPeriod, feedback, status, reviewPeriodStart, reviewPeriodEnd, dueDate, isFinalized } = req.body;
    try {
        // Check if review exists
        const existingReview = await prisma_1.prisma.performanceReview.findUnique({
            where: { id },
            select: {
                id: true,
                reviewerId: true,
                revieweeId: true,
            }
        });
        if (!existingReview) {
            throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Performance review not found');
        }
        // Only admin or the reviewer can update the review
        if (req.user?.role !== types_1.UserRole.ADMIN &&
            req.user?.role !== types_1.UserRole.SUPER_ADMIN &&
            existingReview.reviewerId !== req.user?.id) {
            throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.FORBIDDEN, 'You are not authorized to update this review');
        }
        // Only update allowed fields with proper typing
        const updatePayload = {
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
            updatePayload.overallRating = req.body.overallRating || null;
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
        const updatedReview = await prisma_1.prisma.performanceReview.update({
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
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: updatedReview
        });
    }
    catch (error) {
        console.error('Error updating performance review:', error);
        const prismaError = error;
        if (prismaError.code === 'P2025') {
            throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Performance review not found', true);
        }
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to update performance review', true, [errorMessage]);
    }
};
exports.updatePerformanceReview = updatePerformanceReview;
/**
 * Get performance metrics for a team
 * @route GET /api/v1/performance/team/:teamId
 * @access Private (Team Lead, Manager, Admin)
 */
const getTeamPerformance = async (req, res) => {
    const { teamId } = req.params;
    const { period = 'current' } = req.query;
    try {
        // Verify the requesting user has permission to view team performance
        if (req.user?.role !== types_1.UserRole.ADMIN && req.user?.role !== types_1.UserRole.SUPER_ADMIN) {
            // For non-admins, check if they're the team lead
            const team = await prisma_1.prisma.team.findUnique({
                where: { id: teamId },
                select: { leaderId: true },
            });
            if (!team || team.leaderId !== req.user?.id) {
                throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.FORBIDDEN, 'You do not have permission to view performance data for this team');
            }
        }
        // Get all active team members
        const teamMembers = await prisma_1.prisma.user.findMany({
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
        });
        if (teamMembers.length === 0) {
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
                success: false,
                message: 'No active team members found for this team',
            });
        }
        const memberIds = teamMembers.map((member) => member.id);
        // Get performance reviews for all team members
        const reviews = await prisma_1.prisma.performanceReview.findMany({
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
        const memberPerformance = teamMembers.map((member) => {
            const memberReviews = reviews.filter((review) => review.revieweeId === member.id);
            const totalScore = memberReviews.reduce((sum, review) => {
                return sum + (review.overallRating ? mapRatingToScore(review.overallRating) : 0);
            }, 0);
            const averageScore = memberReviews.length > 0 ? Math.round(totalScore / memberReviews.length) : 0;
            const status = memberReviews.length > 0 ? 'REVIEWED' : 'PENDING';
            const lastReview = memberReviews.length > 0 ? memberReviews[0].reviewDate : null;
            return {
                ...member,
                totalReviews: memberReviews.length,
                averageScore,
                lastReview,
                status
            };
        });
        // Sort members by average score (highest first)
        memberPerformance.sort((a, b) => b.averageScore - a.averageScore);
        // Calculate metrics for the team
        const totalScore = memberPerformance.reduce((sum, member) => {
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
            period: period,
            membersWithReviews: memberPerformance.filter(m => m.totalReviews > 0).length
        };
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: responseData
        });
    }
    catch (error) {
        console.error('Error getting team performance:', error);
        if (error instanceof api_error_1.ApiError) {
            throw error;
        }
        else if (error instanceof Error) {
            throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to get team performance data');
        }
        else {
            const apiError = new api_error_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to get team performance data');
            apiError.message = `${apiError.message}: Unknown error`;
            throw apiError;
        }
    }
};
exports.getTeamPerformance = getTeamPerformance;
/**
 * Get all employee performance data
 * @route GET /api/v1/performance/employees
 * @access Private (Admin)
 */
const getAllEmployeePerformance = async (req, res) => {
    try {
        // First, get all active users with their basic info
        const users = await prisma_1.prisma.user.findMany({
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
        const performanceReviews = await prisma_1.prisma.performanceReview.findMany({
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
        const reviewsByUser = performanceReviews.reduce((acc, review) => {
            if (!acc[review.revieweeId]) {
                acc[review.revieweeId] = [];
            }
            acc[review.revieweeId].push(review);
            return acc;
        }, {});
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
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: employeePerformance
        });
    }
    catch (error) {
        console.error('Error in getAllEmployeePerformance:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch all employee performance data', true, [{ message: errorMessage }]);
    }
};
exports.getAllEmployeePerformance = getAllEmployeePerformance;
// Weekly performance data
const getWeeklyPerformanceData = async (req, res) => {
    // Return mock weekly data structure expected by frontend
    const weeklyData = [
        { week: '2024-06-01', score: 80 },
        { week: '2024-06-08', score: 85 },
        { week: '2024-06-15', score: 90 }
    ];
    return res.json(weeklyData);
};
exports.getWeeklyPerformanceData = getWeeklyPerformanceData;
const getOverallPerformanceData = async (req, res) => {
    // Return mock overall data structure expected by frontend
    const teamPerformance = [
        { team_name: 'Engineering', avg_score: 88 },
        { team_name: 'Sales', avg_score: 75 }
    ];
    return res.json(teamPerformance);
};
exports.getOverallPerformanceData = getOverallPerformanceData;
/**
 * Delete a performance review
 * @route DELETE /api/v1/performance/reviews/:id
 * @access Private (Admin)
 */
const deletePerformanceReview = async (req, res) => {
    const { id } = req.params;
    try {
        // Check if review exists
        const existingReview = await prisma_1.prisma.performanceReview.findUnique({
            where: { id }
        });
        if (!existingReview) {
            throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Performance review not found');
        }
        // Delete the review
        await prisma_1.prisma.performanceReview.delete({
            where: { id }
        });
        res.status(http_status_codes_1.StatusCodes.NO_CONTENT).send();
    }
    catch (error) {
        console.error('Error deleting performance review:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to delete performance review', true, [errorMessage]);
    }
};
exports.deletePerformanceReview = deletePerformanceReview;
/**
 * Finalize a performance review
 * @route POST /api/v1/performance/reviews/:id/finalize
 * @access Private (Admin, Manager, Reviewer)
 */
const finalizePerformanceReview = async (req, res) => {
    const { id } = req.params;
    const { comments } = req.body;
    try {
        // Check if review exists
        const existingReview = await prisma_1.prisma.performanceReview.findUnique({
            where: { id },
            select: {
                id: true,
                isFinalized: true,
                reviewerId: true
            }
        });
        if (!existingReview) {
            throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.NOT_FOUND, 'Performance review not found');
        }
        // Check if review is already finalized
        if (existingReview.isFinalized) {
            throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Performance review is already finalized');
        }
        // Check if user is authorized to finalize
        if (req.user?.role !== types_1.UserRole.ADMIN &&
            req.user?.role !== types_1.UserRole.SUPER_ADMIN &&
            existingReview.reviewerId !== req.user?.id) {
            throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.FORBIDDEN, 'You are not authorized to finalize this review');
        }
        // Update the review
        const updatedReview = await prisma_1.prisma.performanceReview.update({
            where: { id },
            data: {
                isFinalized: true,
                finalizedAt: new Date(),
                status: 'COMPLETED'
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
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: updatedReview
        });
    }
    catch (error) {
        console.error('Error finalizing performance review:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new api_error_1.ApiError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to finalize performance review', true, [errorMessage]);
    }
};
exports.finalizePerformanceReview = finalizePerformanceReview;
// Export all controller methods
const performanceController = {
    getEmployeePerformance: exports.getEmployeePerformance,
    createPerformanceReview: exports.createPerformanceReview,
    updatePerformanceReview: exports.updatePerformanceReview,
    getTeamPerformance: exports.getTeamPerformance,
    getAllEmployeePerformance: exports.getAllEmployeePerformance,
    mapRatingToScore,
    getWeeklyPerformanceData: exports.getWeeklyPerformanceData,
    getOverallPerformanceData: exports.getOverallPerformanceData,
    deletePerformanceReview: exports.deletePerformanceReview,
    finalizePerformanceReview: exports.finalizePerformanceReview
};
exports.default = performanceController;
