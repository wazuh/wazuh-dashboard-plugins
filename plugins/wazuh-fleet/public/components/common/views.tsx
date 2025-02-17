import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { AgentList } from '../agents';
// import { GroupList } from '../groups/list/list';
import { AgentDetails } from '../agents/details';
// import { CommandsList } from '../commands';
import { ViewInterface } from '../interfaces/interfaces';
import { getCore } from '../../plugin-services';
import { EnrollAgent } from '../../application/pages/enroll-agent';

export const summaryAgent = {
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

export const agentDetails = {
  name: 'Agent',
  id: 'agentId',
  path: '/agents/:id',
  renderOnMenu: false,
  renderMenu: true,
  render: (props: any) => <AgentDetails {...props} />,
  breadcrumb: (id: string) => [
    {
      className: 'osdBreadcrumbs',
      text: (
        <FormattedMessage
          id={`wz-fleet-management-breadcrumbs-agent-summary`}
          defaultMessage='Summary'
        />
      ),
      href: getCore().application.getUrlForApp('wazuh-fleet', {
        path: `#${summaryAgent.path}`,
      }),
    },
    {
      text: id,
    },
  ],
};

export const enrollmentAgent = {
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
      href: getCore().application.getUrlForApp('wazuh-fleet', {
        path: `#${summaryAgent.path}`,
      }),
    },
    {
      text: 'Agent enrollment',
    },
  ],
};

// export const groupsSummary = {
//   name: 'Groups',
//   id: 'groups',
//   path: '/groups',
//   renderOnMenu: true,
//   renderMenu: true,
//   render: (props: any) => <GroupList {...props} />,
//   breadcrumb: () => [
//     {
//       className: 'osdBreadcrumbs',
//       text: (
//         <FormattedMessage
//           id={`wz-fleet-management-breadcrumbs-groups-summary`}
//           defaultMessage='Summary'
//         />
//       ),
//     },
//   ],
// };

// export const groupDetails = {
//   name: 'Group',
//   id: 'groupId',
//   path: '/groups/:id',
//   renderOnMenu: false,
//   renderMenu: true,
//   render: () => <div>Group</div>,
//   breadcrumb: () => [
//     {
//       className: 'osdBreadcrumbs',
//       text: (
//         <FormattedMessage
//           id={`wz-fleet-management-breadcrumbs-groups-summary`}
//           defaultMessage='Summary'
//         />
//       ),
//     },
//     {
//       className: 'osdBreadcrumbs',
//       text: 'ID OR NAME',
//     },
//   ],
// };

// export const agentsCommands = {
//   name: 'Agents commands',
//   id: 'commands',
//   path: '/commands',
//   renderOnMenu: true,
//   renderMenu: true,
//   render: (props: any) => <CommandsList {...props} />,
//   breadcrumb: () => [
//     {
//       className: 'osdBreadcrumbs',
//       text: (
//         <FormattedMessage
//           id={`wz-fleet-management-breadcrumbs-commands-summary`}
//           defaultMessage='Summary'
//         />
//       ),
//     },
//   ],
// };

// export const commsConfigurations = {
//   name: 'Comms configurations',
//   id: 'comms-configurations',
//   path: '/comms-configurations',
//   renderOnMenu: true,
//   renderMenu: true,
//   render: () => <div>Comms configurations</div>,
//   breadcrumb: () => [
//     {
//       className: 'osdBreadcrumbs',
//       text: (
//         <FormattedMessage
//           id={`wz-fleet-management-breadcrumbs-comms-summary`}
//           defaultMessage='Summary'
//         />
//       ),
//     },
//   ],
// };

export const views: ViewInterface[] = [
  summaryAgent,
  agentDetails,
  enrollmentAgent,
  // groupsSummary,
  // groupDetails,
  // agentsCommands,
  // commsConfigurations,
];
