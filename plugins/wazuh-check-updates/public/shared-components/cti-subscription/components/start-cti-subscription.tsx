import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { EuiButtonEmpty, EuiButtonIcon } from '@elastic/eui';
import { LinkCtiProps } from '../types';
import { getCore } from '../../../plugin-services';

export const StartCtiSubscription: React.FC<LinkCtiProps> = ({
  handleModalToggle,
}) => {
  const isNewHomePageEnable = getCore().uiSettings.get('home:useNewHomePage');

  const navButtonTopRight = (
    <EuiButtonEmpty iconType='rocket' onClick={() => handleModalToggle()}>
      <FormattedMessage
        id='wazuhCheckUpdates.ctiSubscription.openModalRegistry'
        defaultMessage='Registry'
      />
    </EuiButtonEmpty>
  );

  const navButtonBottomLeft = (
    <EuiButtonIcon
      color='text'
      iconType='rocket'
      onClick={() => handleModalToggle()}
    />
  );

  return isNewHomePageEnable ? navButtonBottomLeft : navButtonTopRight;
};
