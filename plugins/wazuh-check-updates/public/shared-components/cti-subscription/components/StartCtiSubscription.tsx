import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { EuiButtonEmpty, EuiIcon } from '@elastic/eui';
import { LinkCtiProps } from '../types';

export const StartCtiSubscription: React.FC<LinkCtiProps> = ({
  handleModalToggle,
  isNewHomePageEnable,
}) => {
  const navButtonTopRight = (
    <EuiButtonEmpty iconType='rocket' onClick={() => handleModalToggle()}>
      <FormattedMessage
        id='wazuhCheckUpdates.ctiSubscription.openModalRegistry'
        defaultMessage='Registry'
      />
    </EuiButtonEmpty>
  );

  const navButtonBottomLeft = (
    <EuiButtonEmpty flush='both' onClick={() => handleModalToggle()}>
      <EuiIcon color='text' type='rocket' />
    </EuiButtonEmpty>
  );

  return isNewHomePageEnable ? navButtonBottomLeft : navButtonTopRight;
};
