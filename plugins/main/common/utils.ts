/**
 * 
 * @param timeMs Time in milliseconds
 * @returns Promise
 */
export const delayAsPromise = (timeMs: number) => new Promise(resolve => setTimeout(resolve, timeMs));