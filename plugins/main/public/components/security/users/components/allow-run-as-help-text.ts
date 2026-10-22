import { i18n } from '@osd/i18n';

// Shared by the users table tooltip and the create and edit user forms.
export const getAllowRunAsHelpText = () =>
  i18n.translate('wazuh.security.users.allowRunAsHelpText', {
    defaultMessage:
      'Lets the dashboard call the API on behalf of the signed-in user, whose Wazuh roles then come from Roles mapping. Also needs run as enabled in the API host configuration.',
  });
