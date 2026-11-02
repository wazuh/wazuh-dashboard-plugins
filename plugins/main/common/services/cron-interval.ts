import { validate } from 'node-cron';

/**
 * Check a cron expression used to schedule a job.
 * node-cron accepts repeated, leading or trailing whitespace but then reads the
 * day-of-month and day-of-week fields from the wrong positions, so the fields
 * must be separated by a single space.
 * @param expression Cron expression
 * @returns Whether the expression is valid
 */
export function isValidCronInterval(expression: string): boolean {
  return (
    typeof expression === 'string' &&
    expression === expression.trim().split(/\s+/).join(' ') &&
    validate(expression)
  );
}
