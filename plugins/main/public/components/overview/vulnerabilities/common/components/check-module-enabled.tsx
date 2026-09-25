import React, { useEffect, useState } from 'react';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { clusterNodes } from '../../../../../controllers/management/components/management/configuration/utils/wz-fetch';
import { WzRequest } from '../../../../../react-services';
import { webDocumentationLink } from '../../../../../../common/services/web_documentation';
import { EuiCallOut, EuiLink } from '@elastic/eui';
import { UI_LOGGER_LEVELS } from '../../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../../react-services/common-services';
import { useUserPermissionsRequirements } from '../../../../common/hooks';
import { isConfigEnabled } from '../../../../../../common/services/configuration-value';

export async function checkVDIsEnabledCluster() {
  // Get nodes
  const responseNodes = await clusterNodes();

  const nodes = responseNodes.data.data.affected_items.map(({ name }) => name);

  // Check if at least some of the nodes has the module enabled
  for (const node of nodes) {
    const responseNodeWmodules = await WzRequest.apiReq(
      'GET',
      `/cluster/${node}/configuration/wmodules/wmodules`,
      {},
    );
    const vdConfiguration =
      responseNodeWmodules.data.data?.affected_items?.[0]?.wmodules?.find(
        ({ ['vulnerability-detection']: wmodule }) => wmodule,
      );
    if (
      isConfigEnabled(vdConfiguration?.['vulnerability-detection']?.enabled)
    ) {
      return true;
    }
  }
  return false;
}

export const ModuleEnabledCheck = () => {
  const [data, setData] = useState<{ enabled: boolean } | null>(null);
  const [userPermissionRequirements] = useUserPermissionsRequirements([
    { action: 'cluster:read', resource: 'node:id:*' },
  ]);

  const checkVDIsEnabled = async () => {
    try {
      setData(null);
      const enabled = await checkVDIsEnabledCluster();
      setData({ enabled });
    } catch (error) {
      const options = {
        context: `${ModuleEnabledCheck.name}.useEffect`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: i18n.translate(
            'wazuh.vulnerabilityDetection.moduleEnabledCheck.errorChecking',
            {
              defaultMessage: 'Error checking if the module is enabled',
            },
          ),
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  };

  useEffect(() => {
    /* Only check if the module is enabled if the user has the expected permissions to
    do the API requests */
    if (!userPermissionRequirements) {
      checkVDIsEnabled();
    }
  }, [userPermissionRequirements]);

  return data?.enabled === false ? (
    <EuiCallOut
      title={i18n.translate(
        'wazuh.vulnerabilityDetection.moduleEnabledCheck.callout.title',
        {
          defaultMessage: 'Warning',
        },
      )}
      color='warning'
      iconType='alert'
    >
      <p>
        <FormattedMessage
          id='wazuh.vulnerabilityDetection.moduleEnabledCheck.callout.description'
          defaultMessage='Vulnerabilies detection module is not enabled. You can learn to how to configure following the {documentationLink}.'
          values={{
            documentationLink: (
              <EuiLink
                href={webDocumentationLink(
                  'user-manual/capabilities/vulnerability-detection/configuring-scans.html#configuration',
                )}
                external
                target='_blank'
                rel='noopener noreferrer'
              >
                {i18n.translate(
                  'wazuh.vulnerabilityDetection.moduleEnabledCheck.callout.documentationLink',
                  {
                    defaultMessage: 'documentation',
                  },
                )}
              </EuiLink>
            ),
          }}
        />
      </p>
    </EuiCallOut>
  ) : null;
};
