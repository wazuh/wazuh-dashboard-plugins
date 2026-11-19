import React from 'react';
import { EuiSwitch } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import {
  ServerEndpointFields,
  useRememberServerEndpoint,
} from './use-remember-server-endpoint';

/* Saves the address, the port and the path prefix as the endpoint the forms
are prefilled with. */
export const RememberServerEndpointSwitch = (fields: ServerEndpointFields) => {
  const { isRemembered, isDisabled, onToggle } =
    useRememberServerEndpoint(fields);

  return (
    <EuiSwitch
      disabled={isDisabled}
      label={i18n.translate('wazuh.common.rememberServerEndpoint.label', {
        defaultMessage: 'Remember address, port, and path prefix',
      })}
      checked={isRemembered}
      onChange={event => onToggle(event.target.checked)}
      data-test-subj='rememberServerEndpoint'
    />
  );
};
