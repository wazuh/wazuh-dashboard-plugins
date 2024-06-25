import React from 'react';
import { EuiSideNav } from '@elastic/eui';

export const FleetSideMenu = () => {
  const sideNav = [
    {
      name: 'Fleet management',
      id: 'fleet-management',
      items: [
        {
          name: 'Agents summary',
          id: 'agents-summary',
          isSelected: true,
        },
        {
          name: 'Agents groups',
          id: 'agents-groups',
          href: '/#/navigation/side-nav',
        },
        {
          name: 'Agent commands',
          id: 'agents-commands',
        },
        {
          name: 'Comms configuration',
          id: 'comms-configuration',
        },
      ],
    },
  ];

  return <EuiSideNav items={sideNav} />;
};
