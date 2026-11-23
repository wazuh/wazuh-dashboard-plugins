import React, { useEffect, useRef } from 'react';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { EuiCallOut, EuiCode, EuiLink, EuiSpacer } from '@elastic/eui';
import { DOCS_PATHS } from '../../../../common/services/docs-paths';
import { webDocumentationLink } from '../../../../common/services/web_documentation';
import { EnhancedFieldConfiguration } from '../../common/form/types';

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

/* Nothing to compare with while the names load or when they cannot be loaded. */
export const isAddressOutsideCertificate = (
  rawAddress: unknown,
  certificateNames: string[],
) => {
  const address = String(rawAddress ?? '').trim();

  return (
    address.length > 0 &&
    certificateNames.length > 0 &&
    !certificateNames.some(name => matchesCertificateName(name, address))
  );
};

/* Empties the address prefilled from `enrollment.dns` once the names load, when
the manager would refuse it, so the form opens without a warning. `onCleared`
lets the form take the empty value as its starting point. */
export const useClearPrefilledAddressOutsideCertificate = (
  address: EnhancedFieldConfiguration,
  certificateNames: string[],
  onCleared?: () => void,
) => {
  const isChecked = useRef(false);

  useEffect(() => {
    if (isChecked.current || certificateNames.length === 0) {
      return;
    }
    isChecked.current = true;
    if (
      address.value === address.initialValue &&
      isAddressOutsideCertificate(address.value, certificateNames)
    ) {
      address.onChange({ target: { value: '' } });
      onCleared?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [certificateNames]);
};

/* Shared by the token flyout and the deploy wizard. The address only changes on
blur, Enter or picking an option, so the warning never shows while typing. */
export const AddressOutsideCertificateWarning = ({
  address: rawAddress,
  certificateNames,
}: AddressOutsideCertificateWarningProps) => {
  if (!isAddressOutsideCertificate(rawAddress, certificateNames)) {
    return null;
  }

  const address = <EuiCode>{String(rawAddress).trim()}</EuiCode>;

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
          { defaultMessage: 'The manager will refuse this address' },
        )}
      >
        <p>
          <FormattedMessage
            id='wazuh.enrollmentTokens.addressOutsideCertificateWarning.message'
            defaultMessage="{address} isn't in the manager's certificate. Agents can only connect through an address in that certificate, so the token can't be created. Pick an address from the list, or, if your agents must use {address}, add it to the manager's certificate first. {docsLink}"
            values={{
              address,
              docsLink: (
                <EuiLink
                  href={webDocumentationLink(
                    DOCS_PATHS.agentEnrollmentTroubleshooting,
                  )}
                  target='_blank'
                  external
                  rel='noopener noreferrer'
                  data-test-subj='addressOutsideCertificateDocsLink'
                >
                  {i18n.translate(
                    'wazuh.enrollmentTokens.addressOutsideCertificateWarning.docsLink',
                    { defaultMessage: 'How to add an address' },
                  )}
                </EuiLink>
              ),
            }}
          />
        </p>
      </EuiCallOut>
    </>
  );
};
