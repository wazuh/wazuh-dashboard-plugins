import { i18n } from '@osd/i18n';
import { SeverityBand } from '../interfaces/types';
import { HOME_OVERVIEW_COLOR, HOME_OVERVIEW_TEXT_COLOR } from './theme-colors';

export interface SeverityPresentation {
  band: SeverityBand;
  label: string;
  color: string;
}

/**
 * Label and color per band, shared by every severity visualization. Colors come from
 * `HOME_OVERVIEW_COLOR` (theme-aware CSS custom properties) rather than the frozen hex in
 * `UI_COLOR_STATUS`.
 */
export const SEVERITY_PRESENTATION: SeverityPresentation[] = [
  {
    band: 'critical',
    label: i18n.translate('wazuh.common.homeOverviewSeverity.critical', {
      defaultMessage: 'Critical',
    }),
    color: HOME_OVERVIEW_COLOR.danger,
  },
  {
    band: 'high',
    label: i18n.translate('wazuh.common.homeOverviewSeverity.high', {
      defaultMessage: 'High',
    }),
    color: HOME_OVERVIEW_COLOR.warning,
  },
  {
    band: 'medium',
    label: i18n.translate('wazuh.common.homeOverviewSeverity.medium', {
      defaultMessage: 'Medium',
    }),
    color: HOME_OVERVIEW_COLOR.info,
  },
  {
    band: 'low',
    label: i18n.translate('wazuh.common.homeOverviewSeverity.low', {
      defaultMessage: 'Low',
    }),
    color: HOME_OVERVIEW_COLOR.success,
  },
  {
    band: 'informational',
    label: i18n.translate('wazuh.common.homeOverviewSeverity.informational', {
      defaultMessage: 'Informational',
    }),
    color: HOME_OVERVIEW_TEXT_COLOR.text,
  },
];
