import React from 'react';
import { EuiButtonGroup, EuiCallOut, EuiLink } from '@elastic/eui';
import { OSVersion } from '../types';
import { webDocumentationLink } from '../../../../../common/services/web_documentation';

type Props = {
  OSVersion: OSVersion;
  legend: string;
  options: Array<{ id: string; label: string }>;
  wazuhVersion: string;
  onChange: (id: string) => OSVersion;
};

export const ButtonGroupWithMessage = ({
  legend,
  options,
  OSVersion,
  onChange,
  wazuhVersion,
}: Props) => {
  const appVersionMajorDotMinor = wazuhVersion.split('.').slice(0, 2).join('.');

  return (
    <>
      <EuiButtonGroup
        color='primary'
        legend={legend}
        options={options}
        idSelected={OSVersion}
        onChange={onChange}
        className={'osButtonsStyle'}
      />
      {OSVersion == 'solaris10' || OSVersion == 'solaris11' ? (
        <EuiCallOut
          color='warning'
          className='message'
          iconType='iInCircle'
          title={
            <span>
              Might require some extra installation{' '}
              <EuiLink
                target='_blank'
                href={webDocumentationLink(
                  'installation-guide/wazuh-agent/wazuh-agent-package-solaris.html',
                  appVersionMajorDotMinor,
                )}
              >
                steps
              </EuiLink>
              .
            </span>
          }
        ></EuiCallOut>
      ) : OSVersion == '6.1 TL9' ? (
        <EuiCallOut
          color='warning'
          className='message'
          iconType='iInCircle'
          title={
            <span>
              Might require some extra installation{' '}
              <EuiLink
                target='_blank'
                href={webDocumentationLink(
                  'installation-guide/wazuh-agent/wazuh-agent-package-aix.html',
                  appVersionMajorDotMinor,
                )}
              >
                steps
              </EuiLink>
              .
            </span>
          }
        ></EuiCallOut>
      ) : OSVersion == '11.31' ? (
        <EuiCallOut
          color='warning'
          className='message'
          iconType='iInCircle'
          title={
            <span>
              Might require some extra installation{' '}
              <EuiLink
                target='_blank'
                href={webDocumentationLink(
                  'installation-guide/wazuh-agent/wazuh-agent-package-hpux.html',
                  appVersionMajorDotMinor,
                )}
              >
                steps
              </EuiLink>
              .
            </span>
          }
        ></EuiCallOut>
      ) : OSVersion == 'debian7' ||
        OSVersion == 'debian8' ||
        OSVersion == 'debian9' ||
        OSVersion == 'debian10' ? (
        <EuiCallOut
          color='warning'
          className='message'
          iconType='iInCircle'
          title={
            <span>
              Might require some extra installation{' '}
              <EuiLink
                target='_blank'
                href={webDocumentationLink(
                  'installation-guide/wazuh-agent/wazuh-agent-package-linux.html',
                  appVersionMajorDotMinor,
                )}
              >
                steps
              </EuiLink>
              .
            </span>
          }
        ></EuiCallOut>
      ) : (
        ''
      )}
    </>
  );
};

export default ButtonGroupWithMessage;
