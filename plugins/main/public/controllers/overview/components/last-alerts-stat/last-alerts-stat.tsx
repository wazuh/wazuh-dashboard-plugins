import { UI_COLOR_STATUS } from '../../../../../common/constants';

export const severities = {
  low: {
    label: 'Low',
    color: UI_COLOR_STATUS.success,
  },
  medium: {
    label: 'Medium',
    color: UI_COLOR_STATUS.info,
  },
  high: {
    label: 'High',
    color: UI_COLOR_STATUS.warning,
  },
  critical: {
    label: 'Critical',
    color: UI_COLOR_STATUS.danger,
  },
} as const;
