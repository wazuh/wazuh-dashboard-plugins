import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { EuiCode, EuiIcon, EuiSpacer, EuiText } from '@elastic/eui';
import { getCoveringWildcardName } from './address-outside-certificate-warning';

interface AddressCoveredByWildcardNoticeProps {
  address: string;
  /* The names in the manager listener certificate, wildcards included. */
  certificateNames: string[];
}

/* The certificate names the combo box offers leave out the wildcard ones, so
an address typed against one would otherwise get no feedback at all: this says
why the manager accepts it. Shown next to the outside-the-certificate warning,
in the token flyout and the deploy wizard. */
export const AddressCoveredByWildcardNotice = ({
  address,
  certificateNames,
}: AddressCoveredByWildcardNoticeProps) => {
  const pattern = getCoveringWildcardName(
    String(address ?? ''),
    certificateNames,
  );

  if (!pattern) {
    return null;
  }

  return (
    <>
      <EuiSpacer size='s' />
      <EuiText
        size='xs'
        color='success'
        data-test-subj='addressCoveredByWildcardNotice'
      >
        <EuiIcon type='check' size='s' aria-hidden='true' />{' '}
        <FormattedMessage
          id='wazuh.enrollmentTokens.addressCoveredByWildcardNotice.message'
          defaultMessage='Covered by {pattern} in the manager certificate.'
          values={{ pattern: <EuiCode>{pattern}</EuiCode> }}
        />
      </EuiText>
    </>
  );
};
