import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { EuiButtonEmpty, EuiButtonIcon, EuiToolTip } from '@elastic/eui';
import { LinkCtiProps } from '../types';
import { getCore } from '../../../plugin-services';

export const StartCtiSubscription: React.FC<LinkCtiProps> = ({
  handleModalToggle,
}) => {
  const isNewHomePageEnable = getCore().uiSettings.get('home:useNewHomePage');

  const navButtonTopRight = (
    <EuiToolTip position='bottom' content='Subscribe to CTI updates'>
      <EuiButtonEmpty iconType='rocket' onClick={() => handleModalToggle()}>
        <FormattedMessage
          id='wazuhCheckUpdates.ctiSubscription.openModalRegistry'
          defaultMessage='Registry'
        />
      </EuiButtonEmpty>
    </EuiToolTip>
  );

  const navButtonBottomLeft = (
    <EuiToolTip position='top' content='Subscribe to CTI updates'>
      <EuiButtonIcon
        aria-label='Subscribe to CTI updates'
        color='text'
        iconType='rocket'
        onClick={() => handleModalToggle()}
      />
    </EuiToolTip>
  );

  return isNewHomePageEnable ? navButtonBottomLeft : navButtonTopRight;
};
