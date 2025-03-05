import React, { useEffect, useState } from 'react';
import {
  clusterReq,
  clusterNodes,
} from '../../../../../controllers/management/components/management/configuration/utils/wz-fetch';
import { WzRequest } from '../../../../../react-services';
import { webDocumentationLink } from '../../../../../../common/services/web_documentation';
import { EuiCallOut, EuiLink } from '@elastic/eui';
import { UI_LOGGER_LEVELS } from '../../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../../react-services/common-services';
import { useUserPermissionsRequirements } from '../../../../common/hooks';

async function checkVDIsEnabledCluster() {
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
    if (vdConfiguration?.['vulnerability-detection']?.enabled === 'yes') {
      return true;
    }
  }
  return false;
}

async function checkVDIsEnabledManager() {
  const responseWmodules = await WzRequest.apiReq(
    'GET',
    `/manager/configuration/wmodules/wmodules`,
    {},
  );

  const vdConfiguration =
    responseWmodules.data.data?.affected_items?.[0]?.wmodules?.find(
      ({ ['vulnerability-detection']: wmodule }) => wmodule,
    );
  return vdConfiguration?.['vulnerability-detection']?.enabled === 'yes';
}

export const ModuleEnabledCheck = () => {
  return <div>MODULE_CHECK</div>;
  const [data, setData] = useState<{ enabled: boolean } | null>(null);
  const [userPermissionRequirements] = useUserPermissionsRequirements([
    { action: 'cluster:status', resource: '*:*:*' },
    { action: 'cluster:read', resource: 'node:id:*' },
    { action: 'manager:read', resource: '*:*:*' },
  ]);

  const checkVDIsEnabled = async () => {
    try {
      // Check cluster status
      setData(null);
      const clusterStatus = await clusterReq();

      // Check if the module is enabled
      const enabled =
        clusterStatus.data.data.enabled === 'yes' &&
        clusterStatus.data.data.running === 'yes'
          ? await checkVDIsEnabledCluster()
          : await checkVDIsEnabledManager();
      setData({ enabled });
    } catch (error) {
      const options = {
        context: `${ModuleEnabledCheck.name}.useEffect`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: 'Error checking if the module is enabled',
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
    <EuiCallOut title='Warning' color='warning' iconType='alert'>
      <p>
        Vulnerabilies detection module is not enabled. You can learn to how to
        configure following the{' '}
        <EuiLink
          href={webDocumentationLink(
            'user-manual/capabilities/vulnerability-detection/configuring-scans.html#configuring-vulnerability-detection',
          )}
          external
          target='_blank'
          rel='noopener noreferrer'
        >
          documentation
        </EuiLink>
        .
      </p>
    </EuiCallOut>
  ) : null;
};
