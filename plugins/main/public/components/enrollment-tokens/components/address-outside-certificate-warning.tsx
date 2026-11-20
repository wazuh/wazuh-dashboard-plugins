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

/* A wildcard name (`*.example.com`) covers exactly one non-empty leading label. */
export const matchesCertificateName = (name: string, address: string) => {
  const [first, ...domain] = name.toLowerCase().split('.');
  const [label, ...rest] = address.toLowerCase().split('.');

  return first === '*'
    ? label.length > 0 && rest.join('.') === domain.join('.')
    : name.toLowerCase() === address.toLowerCase();
};

/* The wildcard name that covers the address, when no exact name does. A typed
wildcard (`*.example.com`) is a pattern, not an address, so it is covered by
nothing. */
export const getCoveringWildcardName = (
  address: string,
  certificateNames: string[],
): string | undefined => {
  const trimmed = address.trim();

  if (!trimmed || trimmed.includes('*')) {
    return undefined;
  }

  if (
    certificateNames.some(
      name => !name.includes('*') && matchesCertificateName(name, trimmed),
    )
  ) {
    return undefined;
  }

  return certificateNames.find(
    name => name.startsWith('*.') && matchesCertificateName(name, trimmed),
  );
};

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
    !certificateNames.some(name => matchesCertificateName(name, address));

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
