"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationMiddleware = exports.getPaginationOptions = exports.paginationFields = void 0;
exports.paginationFields = ['page', 'limit', 'sortBy', 'sortOrder'];
const getPaginationOptions = (query) => ({
    page: query.page ? Math.max(1, parseInt(query.page, 10)) : 1,
    limit: query.limit ? Math.max(1, parseInt(query.limit, 10)) : 10,
    sortBy: query.sortBy || 'createdAt',
    sortOrder: query.sortOrder || 'desc',
});
exports.getPaginationOptions = getPaginationOptions;
const paginationMiddleware = (req, res, next) => {
    req.paginationOptions = (0, exports.getPaginationOptions)(req.query);
    next();
};
exports.paginationMiddleware = paginationMiddleware;
