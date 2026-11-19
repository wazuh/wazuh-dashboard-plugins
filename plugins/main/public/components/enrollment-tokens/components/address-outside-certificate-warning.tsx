import React from 'react';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { EuiCallOut, EuiCode, EuiSpacer } from '@elastic/eui';
import { useSelector } from 'react-redux';

interface AddressOutsideCertificateWarningProps {
  address: string;
  /* The names in the manager listener certificate, as reported by the address
  input. Empty while they load or when they cannot be loaded, which leaves
  nothing to compare the address with. */
  certificateNames: string[];
}

/* Shared by the token flyout and the deploy wizard: the manager refuses an
address outside its listener certificate, and the value both views prefill comes
from `enrollment.dns`, which after a migration is often not in it. */
export const AddressOutsideCertificateWarning = ({
  address: rawAddress,
  certificateNames,
}: AddressOutsideCertificateWarningProps) => {
  const configuredAddress = useSelector(
    (state: { appConfig: { data?: Record<string, string> } }) =>
      state.appConfig.data?.['enrollment.dns'] || '',
  );
  const address = String(rawAddress ?? '').trim();
  const isOutsideCertificate =
    address.length > 0 &&
    certificateNames.length > 0 &&
    !certificateNames.some(
      name => name.toLowerCase() === address.toLowerCase(),
    );

  if (!isOutsideCertificate) {
    return null;
  }

  return (
    <>
      <EuiSpacer size='s' />
      <EuiCallOut
        size='s'
        color='warning'
        iconType='alert'
        data-test-subj='addressOutsideCertificateWarning'
        title={i18n.translate(
          'wazuh.enrollmentTokens.addressOutsideCertificateWarning.title',
          { defaultMessage: 'The address is not in the manager certificate' },
        )}
      >
        <p>
          {address === configuredAddress ? (
            <FormattedMessage
              id='wazuh.enrollmentTokens.addressOutsideCertificateWarning.fromSetting'
              defaultMessage='This value comes from the {setting} setting. The manager will refuse it unless it is one of the names in its listener certificate. Pick one of the suggested names, add this name to the certificate, or remember another address below to update the setting.'
              values={{ setting: <EuiCode>enrollment.dns</EuiCode> }}
            />
          ) : (
            i18n.translate(
              'wazuh.enrollmentTokens.addressOutsideCertificateWarning.typed',
              {
                defaultMessage:
                  'The manager will refuse it unless it is one of the names in its listener certificate. Pick one of the suggested names or add this name to the certificate.',
              },
            )
          )}
        </p>
      </EuiCallOut>
    </>
  );
};
