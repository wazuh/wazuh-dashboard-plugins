import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { AgentList } from '../agents';
import { AgentDetails } from '../agents/details';
import { ViewInterface } from '../interfaces/interfaces';
import { getCore } from '../../plugin-services';
import { EnrollAgent } from '../../application/pages/enroll-agent';
import { AGENTS_SUMMARY_ID } from '../../groups/agents/applications';

export const summaryAgent: ViewInterface = {
  name: 'Agents',
  id: 'agents',
  path: '/agents',
  renderOnMenu: true,
  renderMenu: true,
  render: (props: any) => <AgentList {...props} />,
  breadcrumb: () => [
    {
      className: 'osdBreadcrumbs',
      text: (
        <FormattedMessage
          id={`wz-fleet-management-breadcrumbs-agent-summary`}
          defaultMessage='Summary'
        />
      ),
    },
  ],
};

export const agentDetails: ViewInterface = {
  name: 'Agent',
  id: 'agentId',
  path: '/agents/:id',
  renderOnMenu: false,
  renderMenu: true,
  render: (props: any) => <AgentDetails {...props} />,
  breadcrumb: id => [
    {
      className: 'osdBreadcrumbs',
      text: (
        <FormattedMessage
          id={`wz-fleet-management-breadcrumbs-agent-summary`}
          defaultMessage='Summary'
        />
      ),
      href: getCore().application.getUrlForApp(AGENTS_SUMMARY_ID, {
        path: `#${summaryAgent.path}`,
      }),
    },
    {
      text: id,
    },
  ],
};

export const enrollmentAgent: ViewInterface = {
  name: 'Enrollment agent',
  id: 'enrollmentAgent',
  path: '/enrollment/agent',
  renderOnMenu: false,
  renderMenu: false,
  render: () => <EnrollAgent />,
  breadcrumb: () => [
    {
      className: 'osdBreadcrumbs',
      text: (
        <FormattedMessage
          id={`wz-fleet-management-breadcrumbs-agent-summary`}
          defaultMessage='Summary'
        />
      ),
      href: getCore().application.getUrlForApp(AGENTS_SUMMARY_ID, {
        path: `#${summaryAgent.path}`,
      }),
    },
    {
      text: 'Agent enrollment',
    },
  ],
};

export const views: ViewInterface[] = [
  summaryAgent,
  agentDetails,
  enrollmentAgent,
];
