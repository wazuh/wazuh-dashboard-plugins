import React from 'react';
import {
  EuiCallOut,
  EuiCode,
  EuiLink,
  EuiSpacer,
  EuiSwitch,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';

interface IPackageSourceProps {
  usesLocalPackage: boolean;
  onChange: (usesLocalPackage: boolean) => void;
  packageName: string;
  urlPackage: string;
}

/* Endpoints without Internet access cannot download the package, so the
operator can install one they already copied to the endpoint instead. */
export default function PackageSource({
  usesLocalPackage,
  onChange,
  packageName,
  urlPackage,
}: IPackageSourceProps) {
  return (
    <>
      <EuiSwitch
        data-test-subj='registerAgentLocalPackageSwitch'
        checked={usesLocalPackage}
        onChange={event => onChange(event.target.checked)}
        label={i18n.translate(
          'wazuh.endpointsSummary.packageSource.localPackageLabel',
          { defaultMessage: 'I already have the package on the endpoint' },
        )}
      />
      {usesLocalPackage ? (
        <>
          <EuiSpacer size='s' />
          <EuiCallOut
            color='primary'
            iconType='iInCircle'
            size='s'
            data-test-subj='registerAgentLocalPackageHelp'
          >
            <p>
              <FormattedMessage
                id='wazuh.endpointsSummary.packageSource.localPackageHelp'
                defaultMessage='Copy {packageName} to the endpoint and run the command in the folder that holds it. To get the package, download it on a computer with Internet access: {packageLink}.'
                values={{
                  packageName: <EuiCode>{packageName}</EuiCode>,
                  packageLink: (
                    <EuiLink
                      href={urlPackage}
                      target='_blank'
                      rel='noopener noreferrer'
                      external
                    >
                      {urlPackage}
                    </EuiLink>
                  ),
                }}
              />
            </p>
          </EuiCallOut>
        </>
      ) : null}
    </>
  );
}
