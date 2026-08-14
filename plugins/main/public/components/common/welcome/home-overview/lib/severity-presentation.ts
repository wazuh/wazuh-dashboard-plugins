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
    label: 'Critical',
    color: HOME_OVERVIEW_COLOR.danger,
  },
  { band: 'high', label: 'High', color: HOME_OVERVIEW_COLOR.warning },
  { band: 'medium', label: 'Medium', color: HOME_OVERVIEW_COLOR.info },
  { band: 'low', label: 'Low', color: HOME_OVERVIEW_COLOR.success },
  {
    band: 'informational',
    label: 'Informational',
    color: HOME_OVERVIEW_TEXT_COLOR.text,
  },
];
