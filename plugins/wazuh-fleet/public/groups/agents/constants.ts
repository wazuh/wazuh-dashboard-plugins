import { i18n } from '@osd/i18n';
import { MANAGEMENT_CATEGORY } from '../category';

export const AGENTS_ID = 'wz_agents';

export const AGENTS_TITLE = i18n.translate(
  `${MANAGEMENT_CATEGORY.id}.category.${AGENTS_ID}`,
  {
    defaultMessage: 'Agents',
  },
);
export const AGENTS_DESCRIPTION = i18n.translate(
  `${MANAGEMENT_CATEGORY.id}.category.${AGENTS_ID}.description`,
  {
    defaultMessage: 'Manage the fleet of agents.',
  },
);
