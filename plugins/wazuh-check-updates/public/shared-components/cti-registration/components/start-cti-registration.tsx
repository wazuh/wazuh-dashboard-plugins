import React from 'react';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { EuiButtonEmpty, EuiButtonIcon, EuiToolTip } from '@elastic/eui';
import { LinkCtiProps } from '../types';
import { getCore } from '../../../plugin-services';
import { ctiFlowState } from '../../../services/cti-flow-state';

export const StartCtiRegistration: React.FC<
  Pick<LinkCtiProps, 'handleModalToggle'>
> = ({ handleModalToggle }) => {
  const isNewHomePageEnable = getCore().uiSettings.get('home:useNewHomePage');
  const registrationLost = Boolean(ctiFlowState.getRegistrationLost());
  const iconType = registrationLost ? 'alert' : 'globe';

  const tooltip = registrationLost ? (
    <FormattedMessage
      id='wazuhCheckUpdates.ctiRegistration.lostTooltip'
      defaultMessage='Wazuh Cloud registration lost. Open for details.'
    />
  ) : (
    <FormattedMessage
      id='wazuhCheckUpdates.ctiRegistration.registerTooltip'
      defaultMessage='Register your Wazuh XDR'
    />
  );

  const navButtonTopRight = (
    <EuiToolTip position='bottom' content={tooltip}>
      <EuiButtonEmpty
        iconType={iconType}
        color={registrationLost ? 'warning' : 'primary'}
        onClick={() => handleModalToggle()}
      >
        {registrationLost ? (
          <FormattedMessage
            id='wazuhCheckUpdates.ctiRegistration.lostNavTop'
            defaultMessage='CTI · Registration lost'
          />
        ) : (
          <FormattedMessage
            id='wazuhCheckUpdates.ctiRegistration.openModalRegister'
            defaultMessage='CTI'
          />
        )}
      </EuiButtonEmpty>
    </EuiToolTip>
  );

  const navButtonBottomLeft = (
    <EuiToolTip position='top' content={tooltip}>
      <EuiButtonIcon
        aria-label={i18n.translate(
          'wazuhCheckUpdates.ctiRegistration.registerButtonAriaLabel',
          { defaultMessage: 'Wazuh XDR registration' },
        )}
        color={registrationLost ? 'warning' : 'text'}
        iconType={iconType}
        onClick={() => handleModalToggle()}
      />
    </EuiToolTip>
  );

  return isNewHomePageEnable ? navButtonBottomLeft : navButtonTopRight;
};
