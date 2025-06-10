"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pick = void 0;
/**
 * Picks specific properties from an object
 * @param obj Source object
 * @param keys Array of property keys to pick
 * @returns New object with only the specified properties
 */
const pick = (obj, keys) => {
    const result = {};
    for (const key of keys) {
        if (obj && Object.prototype.hasOwnProperty.call(obj, key)) {
            result[key] = obj[key];
        }
    }
    return result;
};
exports.pick = pick;
// Type guard to check if a value is an object with properties
const isObject = (value) => {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
};
