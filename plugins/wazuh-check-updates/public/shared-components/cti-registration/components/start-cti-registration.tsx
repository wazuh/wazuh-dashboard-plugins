import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { EuiButtonEmpty, EuiButtonIcon, EuiToolTip } from '@elastic/eui';
import { LinkCtiProps } from '../types';
import { getCore } from '../../../plugin-services';

export const StartCtiRegistration: React.FC<
  Pick<LinkCtiProps, 'handleModalToggle'>
> = ({ handleModalToggle }) => {
  const isNewHomePageEnable = getCore().uiSettings.get('home:useNewHomePage');

  const navButtonTopRight = (
    <EuiToolTip
      position='bottom'
      content={
        <FormattedMessage
          id='wazuhCheckUpdates.ctiRegistration.registerTooltip'
          defaultMessage='Register your Wazuh XDR'
        />
      }
    >
      <EuiButtonEmpty iconType='globe' onClick={() => handleModalToggle()}>
        <FormattedMessage
          id='wazuhCheckUpdates.ctiRegistration.openModalRegister'
          defaultMessage='Register'
        />
      </EuiButtonEmpty>
    </EuiToolTip>
  );

  const navButtonBottomLeft = (
    <EuiToolTip
      position='top'
      content={
        <FormattedMessage
          id='wazuhCheckUpdates.ctiRegistration.registerTooltip'
          defaultMessage='Register your Wazuh XDR'
        />
      }
    >
      <EuiButtonIcon
        aria-label='Wazuh XDR registration'
        color='text'
        iconType='globe'
        onClick={() => handleModalToggle()}
      />
    </EuiToolTip>
  );

  return isNewHomePageEnable ? navButtonBottomLeft : navButtonTopRight;
};
