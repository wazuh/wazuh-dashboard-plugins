import React from 'react';
import { EuiCallOut, EuiCode, EuiLink } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';

interface ILocalPackageCalloutProps {
  packageName: string;
  urlPackage: string;
}

/* Shown with the command for a package already on the endpoint: names the file
to copy and where to download it on a computer with Internet access. */
export default function LocalPackageCallout({
  packageName,
  urlPackage,
}: ILocalPackageCalloutProps) {
  return (
    <EuiCallOut
      color='primary'
      iconType='iInCircle'
      size='s'
      data-test-subj='registerAgentLocalPackageHelp'
    >
      <p>
        <FormattedMessage
          id='wazuh.endpointsSummary.installCommandOptions.localPackageHelp'
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
  );
}
