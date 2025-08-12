export const StepStatus = {
  PENDING: 'pending',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
} as const;

export type StepStatus = (typeof StepStatus)[keyof typeof StepStatus];
