/**
 * Picks specific properties from an object
 * @param obj Source object
 * @param keys Array of property keys to pick
 * @returns New object with only the specified properties
 */
export const pick = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: readonly K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  
  for (const key of keys) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = obj[key];
    }
  }
  
  return result;
};

// Type guard to check if a value is an object with properties
const isObject = (value: unknown): value is Record<string, any> => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};
