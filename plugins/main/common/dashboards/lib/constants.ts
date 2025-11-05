import { UI_COLOR_STATUS } from '../../constants';

export const STYLE = {
  bgFill: '#000',
  bgColor: false,
  labelColor: false,
  subText: '',
  fontSize: 40,
} as const;

export type Style = typeof STYLE;

export const HEIGHT = 6;
export const DASHBOARD_WIDTH_LIMIT = 48;

export const TYPES = {
  INDEX_PATTERN: 'index-pattern',
  VISUALIZATION: 'visualization',
} as const;

export enum CheckResult {
  Passed = 'Passed',
  Failed = 'Failed',
  NotRun = 'Not run',
  NotApplicable = 'Not applicable',
}

export const CHECK_RESULT_COLOR_MAPPING = {
  [CheckResult.Passed]: UI_COLOR_STATUS.success,
  [CheckResult.Failed]: UI_COLOR_STATUS.failed,
  [CheckResult.NotRun]: UI_COLOR_STATUS.info,
  [CheckResult.NotApplicable]: UI_COLOR_STATUS.notApplicable,
} as const;
