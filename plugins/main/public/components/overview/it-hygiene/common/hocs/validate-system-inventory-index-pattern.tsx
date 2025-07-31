import React from 'react';
import { EuiButton, EuiEmptyPrompt, EuiLink } from '@elastic/eui';
import { withHealthCheckChecks } from '../../../../common/hocs';
import {
  HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_GROUPS_STATES,
  HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_STATES,
  HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_NETWORKS_STATES,
  HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_INTERFACES_STATES,
  HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_PROTOCOLS_STATES,
  HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_PROCESSES_STATES,
  HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_USERS_STATES,
  HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_PORTS_STATES,
  HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_PACKAGES_STATES,
  HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_HOTFIXES_STATES,
  HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_SYSTEM_STATES,
  HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_HARDWARE_STATES,
} from '../../../../../../common/constants';
import { webDocumentationLink } from '../../../../../../common/services/web_documentation';

export const PromptFIMIndexPatternMissing = ({ refresh }) => (
  <EuiEmptyPrompt
    iconType='alert'
    title={<h2>System inventory could be disabled or has a problem</h2>}
    body={
      <>
        <p>
          If this is enabled, then this could be caused by an error in: server
          side, server-indexer connection or indexer side. Review the server and
          indexer logs.
        </p>
        <p>
          Also, you can check the{' '}
          <EuiLink
            href={webDocumentationLink(
              'user-manual/capabilities/system-inventory/index.html',
            )}
            target='_blank'
            rel='noopener noreferrer'
            external
          >
            system inventory documentation.
          </EuiLink>
        </p>
      </>
    }
    actions={
      <EuiButton color='primary' fill onClick={refresh}>
        Refresh
      </EuiButton>
    }
  />
);

export const withSystemInventoryDataSource = withHealthCheckChecks(
  [HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_STATES],
  PromptFIMIndexPatternMissing,
);

export const withSystemInventoryNetworksDataSource = withHealthCheckChecks(
  [HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_NETWORKS_STATES],
  PromptFIMIndexPatternMissing,
);

export const withSystemInventoryInterfacesDataSource = withHealthCheckChecks(
  [HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_INTERFACES_STATES],
  PromptFIMIndexPatternMissing,
);

export const withSystemInventoryProtocolsDataSource = withHealthCheckChecks(
  [HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_PROTOCOLS_STATES],
  PromptFIMIndexPatternMissing,
);

export const withSystemInventoryProcessesDataSource = withHealthCheckChecks(
  [HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_PROCESSES_STATES],
  PromptFIMIndexPatternMissing,
);

export const withSystemInventoryUsersDataSource = withHealthCheckChecks(
  [HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_USERS_STATES],
  PromptFIMIndexPatternMissing,
);

export const withSystemInventoryGroupsDataSource = withHealthCheckChecks(
  [HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_GROUPS_STATES],
  PromptFIMIndexPatternMissing,
);

export const withSystemInventoryTrafficDataSource = withHealthCheckChecks(
  [HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_PORTS_STATES],
  PromptFIMIndexPatternMissing,
);

export const withSystemInventoryPackagesDataSource = withHealthCheckChecks(
  [HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_PACKAGES_STATES],
  PromptFIMIndexPatternMissing,
);

export const withSystemInventoryHotfixesDataSource = withHealthCheckChecks(
  [HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_HOTFIXES_STATES],
  PromptFIMIndexPatternMissing,
);

export const withSystemInventorySystemDataSource = withHealthCheckChecks(
  [HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_SYSTEM_STATES],
  PromptFIMIndexPatternMissing,
);

export const withSystemInventoryHardwareDataSource = withHealthCheckChecks(
  [HEALTH_CHECK_TASK_INDEX_PATTERN_IT_HYGIENE_HARDWARE_STATES],
  PromptFIMIndexPatternMissing,
);
