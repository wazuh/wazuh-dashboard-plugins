import React from 'react';
import { EuiButtonGroup, EuiSpacer, EuiToolTip } from '@elastic/eui';
import { i18n } from '@osd/i18n';

const SHOW_SECRET_OPTION = 'showSecret';
const LOCAL_PACKAGE_OPTION = 'localPackage';

/* The secret in the command: the enrollment token, or the password when the
deployment has no token. */
export type tCommandSecret = 'enrollmentToken' | 'password';

interface IInstallCommandOptionsProps {
  secret?: tCommandSecret;
  showSecret: boolean;
  onShowSecretChange: (showSecret: boolean) => void;
  /* Omitted when the operating system has no command for a local package. */
  localPackage?: {
    enabled: boolean;
    onChange: (enabled: boolean) => void;
  };
}

const withToolTip = (label: string, content: string) => (
  <EuiToolTip content={content} position='top'>
    <span>{label}</span>
  </EuiToolTip>
);

const getSecretOption = (secret: tCommandSecret) =>
  secret === 'enrollmentToken'
    ? withToolTip(
        i18n.translate(
          'wazuh.endpointsSummary.installCommandOptions.showEnrollmentToken',
          { defaultMessage: 'Show enrollment token' },
        ),
        i18n.translate(
          'wazuh.endpointsSummary.installCommandOptions.showEnrollmentTokenTooltip',
          {
            defaultMessage:
              'Shows the enrollment token in the command. The copied command always includes it.',
          },
        ),
      )
    : withToolTip(
        i18n.translate(
          'wazuh.endpointsSummary.installCommandOptions.showPassword',
          { defaultMessage: 'Show password' },
        ),
        i18n.translate(
          'wazuh.endpointsSummary.installCommandOptions.showPasswordTooltip',
          {
            defaultMessage:
              'Shows the password in the command. The copied command always includes it.',
          },
        ),
      );

/* Options of the install command: reveal its secret, and install a package the
operator already copied to the endpoint, for endpoints without Internet access. */
export default function InstallCommandOptions({
  secret,
  showSecret,
  onShowSecretChange,
  localPackage,
}: IInstallCommandOptionsProps) {
  const options = [
    ...(secret
      ? [{ id: SHOW_SECRET_OPTION, label: getSecretOption(secret) }]
      : []),
    ...(localPackage
      ? [
          {
            id: LOCAL_PACKAGE_OPTION,
            label: withToolTip(
              i18n.translate(
                'wazuh.endpointsSummary.installCommandOptions.localPackage',
                {
                  defaultMessage: 'I already have the package on the endpoint',
                },
              ),
              i18n.translate(
                'wazuh.endpointsSummary.installCommandOptions.localPackageTooltip',
                {
                  defaultMessage:
                    'Shows a command that installs a package already copied to the endpoint, for endpoints without Internet access.',
                },
              ),
            ),
          },
        ]
      : []),
  ];

  if (!options.length) {
    return null;
  }

  const onChange = (id: string) => {
    if (id === SHOW_SECRET_OPTION) {
      onShowSecretChange(!showSecret);
    } else if (id === LOCAL_PACKAGE_OPTION && localPackage) {
      localPackage.onChange(!localPackage.enabled);
    }
  };

  return (
    <>
      <EuiSpacer size='s' />
      <EuiButtonGroup
        type='multi'
        buttonSize='s'
        data-test-subj='registerAgentInstallCommandOptions'
        legend={i18n.translate(
          'wazuh.endpointsSummary.installCommandOptions.legend',
          { defaultMessage: 'Install command options' },
        )}
        options={options}
        idToSelectedMap={{
          [SHOW_SECRET_OPTION]: showSecret,
          [LOCAL_PACKAGE_OPTION]: Boolean(localPackage?.enabled),
        }}
        onChange={onChange}
      />
    </>
  );
}
