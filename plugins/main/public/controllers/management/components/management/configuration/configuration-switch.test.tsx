import React from 'react';
import { render } from '@testing-library/react';
import WzConfigurationSwitch from './configuration-switch';
import { queryDataTestAttr } from '../../../../../../test/public/query-attr';

jest.mock('react-redux', () => ({
  connect: () => Component => Component,
  __esModule: true,
}));

jest.mock('redux', () => ({
  compose: () => Component => Component,
  __esModule: true,
}));

jest.mock('./configuration-overview.js', () => () => <></>);

jest.mock('./global-configuration/global-configuration', () => ({
  WzConfigurationGlobalConfigurationManager: () => <></>,
  WzConfigurationGlobalConfigurationAgent: () => <></>,
  __esModule: true,
}));

jest.mock('./edit-configuration/edit-configuration', () => () => <></>);

jest.mock('./registration-service/registration-service', () => () => <></>);

jest.mock('./log-settings/log-settings', () => () => <></>);

jest.mock('./cluster/cluster', () => () => <></>);

jest.mock('./alerts/alerts', () => () => <></>);

jest.mock('./client/client', () => () => <></>);

jest.mock('./client-buffer/client-buffer', () => () => <></>);

jest.mock('./alerts/alerts-labels', () => ({
  WzConfigurationAlertsLabelsAgent: () => <></>,
  __esModule: true,
}));

jest.mock('./integrations/integrations', () => () => <></>);

jest.mock('./policy-monitoring/policy-monitoring', () => () => <></>);

jest.mock('./open-scap/open-scap', () => () => <></>);

jest.mock('./cis-cat/cis-cat', () => () => <></>);

jest.mock('./vulnerabilities/vulnerabilities', () => () => <></>);

jest.mock('./osquery/osquery', () => () => <></>);

jest.mock('./inventory/inventory', () => () => <></>);

jest.mock('./active-response/active-response', () => () => <></>);

jest.mock('./active-response/active-response-agent', () => () => <></>);

jest.mock('./commands/commands', () => () => <></>);

jest.mock('./docker-listener/docker-listener', () => () => <></>);

jest.mock('./log-collection/log-collection', () => () => <></>);

jest.mock('./integrity-monitoring/integrity-monitoring', () => () => <></>);

jest.mock('./agentless/agentless', () => () => <></>);

jest.mock('./aws-s3/aws-s3', () => () => <></>);

jest.mock('./azure-logs/azure-logs', () => () => <></>);

jest.mock('./google-cloud-pub-sub/google-cloud-pub-sub', () => () => <></>);

jest.mock('./github/github', () => ({
  WzConfigurationGitHub: () => <></>,
  __esModule: true,
}));

jest.mock('./util-components/view-selector', () => ({
  default: () => <></>,
  WzViewSelectorSwitch: () => <></>,
  __esModule: true,
}));

jest.mock('./util-components/loading', () => () => <></>);

jest.mock('./util-hocs/render-if', () => ({
  withRenderIfOrWrapped: () => <></>,
  __esModule: true,
}));

jest.mock('./util-components/configuration-path', () => () => <></>);

jest.mock('./util-components/refresh-cluster-info-button', () => () => <></>);

jest.mock('./office365/office365', () => ({
  WzConfigurationOffice365: () => <></>,
  __esModule: true,
}));

jest.mock('../../../../../components/agents/prompts', () => ({
  PromptNoActiveAgentWithoutSelect: () => <></>,
  __esModule: true,
}));

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: (_, opts) => opts.defaultMessage,
  },
  __esModule: true,
}));

jest.mock('../../../../../utils/applications', () => ({
  id: '000',
  __esModule: true,
}));

jest.mock('../../../../../react-services/navigation-service', () => ({
  getInstance: () => ({
    navigate: () => {},
    getPathname: () => '',
    __esModule: true,
  }),
  __esModule: true,
}));

jest.mock('../../../../../components/common/hocs', () => ({
  withUserAuthorizationPrompt: () => () => <></>,
  __esModule: true,
}));

jest.mock('../../../../../react-services/wz-request', () => ({
  WzRequest: {
    apiReq: jest.fn().mockResolvedValue({
      data: {
        data: {
          affected_items: [],
        },
      },
    }),
    __esModule: true,
  },
}));

jest.mock('./utils/wz-fetch', () => ({
  clusterReq: jest.fn().mockResolvedValue({
    data: {
      data: {
        affected_items: [],
      },
    },
  }),
  clusterNodes: jest.fn().mockResolvedValue({
    data: {
      data: {
        affected_items: [],
      },
    },
  }),
}));

describe('WzConfigurationSwitch', () => {});
