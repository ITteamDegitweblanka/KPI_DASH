"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceRating = exports.NotificationType = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    UserRole["ADMIN"] = "ADMIN";
    UserRole["LEADER"] = "LEADER";
    UserRole["SUB_LEADER"] = "SUB_LEADER";
    UserRole["MEMBER"] = "MEMBER";
})(UserRole || (exports.UserRole = UserRole = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["SYSTEM"] = "SYSTEM";
    NotificationType["PERFORMANCE"] = "PERFORMANCE";
    NotificationType["ALERT"] = "ALERT";
    NotificationType["UPDATE"] = "UPDATE";
    NotificationType["OTHER"] = "OTHER";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var PerformanceRating;
(function (PerformanceRating) {
    PerformanceRating["EXCEEDS_EXPECTATIONS"] = "EXCEEDS_EXPECTATIONS";
    PerformanceRating["MEETS_EXPECTATIONS"] = "MEETS_EXPECTATIONS";
    PerformanceRating["NEEDS_IMPROVEMENT"] = "NEEDS_IMPROVEMENT";
    PerformanceRating["UNSATISFACTORY"] = "UNSATISFACTORY";
})(PerformanceRating || (exports.PerformanceRating = PerformanceRating = {}));
