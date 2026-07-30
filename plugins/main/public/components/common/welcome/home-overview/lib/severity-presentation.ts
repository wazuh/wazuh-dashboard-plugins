import { SeverityBand } from '../interfaces/types';
import { UI_COLOR_STATUS } from '../../../../../../common/constants';

export interface SeverityPresentation {
  band: SeverityBand;
  label: string;
  color: string;
}

/** Label and color per band, shared by every severity visualization. */
export const SEVERITY_PRESENTATION: SeverityPresentation[] = [
  { band: 'critical', label: 'Critical', color: UI_COLOR_STATUS.danger },
  { band: 'high', label: 'High', color: UI_COLOR_STATUS.warning },
  { band: 'medium', label: 'Medium', color: UI_COLOR_STATUS.info },
  { band: 'low', label: 'Low', color: UI_COLOR_STATUS.success },
  {
    band: 'informational',
    label: 'Informational',
    color: UI_COLOR_STATUS.disabled,
  },
  {
    band: 'pending',
    label: 'Pending',
    color: UI_COLOR_STATUS.disabled,
  },
];
