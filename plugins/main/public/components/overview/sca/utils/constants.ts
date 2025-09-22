export enum CheckResult {
  Passed = 'Passed',
  Failed = 'Failed',
  NotRun = 'Not run',
}

export const SCA_CHECK_RESULT_COLORS = {
  [CheckResult.Passed]: '#209280',
  [CheckResult.Failed]: '#cc5642',
  [CheckResult.NotRun]: '#6092c0',
} as const;
