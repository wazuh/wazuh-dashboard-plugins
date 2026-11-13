import React from 'react';
import { EuiIcon, EuiToolTip } from '@elastic/eui';
import { i18n } from '@osd/i18n';

interface VerifyCaStatusProps {
  verifyCa?: boolean | null;
  url?: string;
}

const isHttp = (url?: string) => /^http:\/\//i.test(url ?? '');

/** Verify CA status of a server API host: on, off (warning), or unknown. */
export const VerifyCaStatus = ({ verifyCa, url }: VerifyCaStatusProps) => {
  const http = isHttp(url);

  if (verifyCa === true && !http) {
    return (
      <EuiToolTip
        position='top'
        content={i18n.translate(
          'wazuh.dashboardsSettings.verifyCaStatus.enabledTooltip',
          {
            defaultMessage:
              'The dashboard verifies the server API certificate with the configured ca.',
          },
        )}
      >
        <EuiIcon type='check' />
      </EuiToolTip>
    );
  }

  if (verifyCa === false || http) {
    return (
      <EuiToolTip
        position='top'
        content={
          http
            ? i18n.translate(
                'wazuh.dashboardsSettings.verifyCaStatus.httpTooltip',
                {
                  defaultMessage:
                    'The host uses HTTP, so the connection is not encrypted. Use an https URL and set ca for this host in the dashboard configuration.',
                },
              )
            : i18n.translate(
                'wazuh.dashboardsSettings.verifyCaStatus.disabledTooltip',
                {
                  defaultMessage:
                    'The dashboard does not verify the server API certificate. Set ca for this host in the dashboard configuration.',
                },
              )
        }
      >
        <p data-test-subj='verifyCaStatusOff'>
          <EuiIcon type='alert' color='warning' />{' '}
          {i18n.translate('wazuh.dashboardsSettings.verifyCaStatus.off', {
            defaultMessage: 'Off',
          })}
        </p>
      </EuiToolTip>
    );
  }

  return (
    <EuiToolTip
      position='top'
      content={i18n.translate(
        'wazuh.dashboardsSettings.verifyCaStatus.unknownTooltip',
        {
          defaultMessage:
            'Unknown, because the host could not be checked. Refresh to check it again.',
        },
      )}
    >
      <p data-test-subj='verifyCaStatusUnknown'>-</p>
    </EuiToolTip>
  );
};
