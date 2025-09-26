import { UI_COLOR_STATUS } from '../../../../../common/constants';

export enum CheckResult {
  Passed = 'Passed',
  Failed = 'Failed',
  NotRun = 'Not run',
  NotApplicable = 'Not applicable',
}

export const SCA_CHECK_RESULT_COLORS = {
  [CheckResult.Passed]: UI_COLOR_STATUS.success,
  [CheckResult.Failed]: UI_COLOR_STATUS.failed,
  [CheckResult.NotRun]: UI_COLOR_STATUS.info,
  [CheckResult.NotApplicable]: UI_COLOR_STATUS.notApplicable,
} as const;
