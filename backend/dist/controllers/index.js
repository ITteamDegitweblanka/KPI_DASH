"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGoalById = exports.getTeamGoals = exports.deleteGoal = exports.updateGoal = exports.createGoal = exports.getEmployeeGoals = void 0;
var goal_1 = require("./goal");
Object.defineProperty(exports, "getEmployeeGoals", { enumerable: true, get: function () { return goal_1.getEmployeeGoals; } });
Object.defineProperty(exports, "createGoal", { enumerable: true, get: function () { return goal_1.createGoal; } });
Object.defineProperty(exports, "updateGoal", { enumerable: true, get: function () { return goal_1.updateGoal; } });
Object.defineProperty(exports, "deleteGoal", { enumerable: true, get: function () { return goal_1.deleteGoal; } });
Object.defineProperty(exports, "getTeamGoals", { enumerable: true, get: function () { return goal_1.getTeamGoals; } });
Object.defineProperty(exports, "getGoalById", { enumerable: true, get: function () { return goal_1.getGoalById; } });
__exportStar(require("./performance.controller"), exports);
