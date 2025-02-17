import { i18n } from '@osd/i18n';
import { PLUGIN_ID } from '../../../../../common/constants';
import { buildSubAppId } from '../../../../utils';
import { SECURITY_OPERATIONS_ID } from '../../constants';

export const IT_HYGIENE_ID = buildSubAppId(
  SECURITY_OPERATIONS_ID,
  'it_hygiene',
);
export const IT_HYGIENE_TITLE = i18n.translate(
  `${PLUGIN_ID}.category.${IT_HYGIENE_ID}`,
  {
    defaultMessage: 'IT Hygiene',
  },
);
