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

export enum SCA_CHECK_RESULT {
  PASSED = 'Passed',
  FAILED = 'Failed',
  NOT_APPLICABLE = 'Not applicable',
}

export const SCA_CHECK_RESULT_COLOR_MAPPING = {
  [SCA_CHECK_RESULT.PASSED]: UI_COLOR_STATUS.success,
  [SCA_CHECK_RESULT.FAILED]: UI_COLOR_STATUS.failed,
  [SCA_CHECK_RESULT.NOT_APPLICABLE]: UI_COLOR_STATUS.info,
} as const;
