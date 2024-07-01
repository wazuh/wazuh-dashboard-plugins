import React, { useState, useEffect } from 'react';
import { EuiSideNav } from '@elastic/eui';
import { FLEET_MANAGEMENT_OPTIONS } from './constants';

export interface FleetSideMenuProps {
  selectedItem: string;
}

export const FleetSideMenu = ({
  selectedItem,
}: // onSelectItem,
FleetSideMenuProps) => {
  const createItem = (id: string, name: string, href: string) => {
    return {
      id,
      name,
      href,
      isSelected: selectedItem === id,
    };
  };

  const sideNav = [
    {
      name: 'Fleet management',
      id: 'fleet-management',
      items: FLEET_MANAGEMENT_OPTIONS.map(option =>
        createItem(option.id, option.name, option.href),
      ),
    },
  ];

  return <EuiSideNav items={sideNav} />;
};
