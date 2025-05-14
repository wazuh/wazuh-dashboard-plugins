import React from 'react';
import {
  ITHygieneProccessesInventoryPorts,
  ITHygieneProccessesInventoryProcesses,
} from './inventories';
import { ITHygieneInventoryTabLayout } from '../common/components/inventory';

const tabs = [
  {
    id: 'processes',
    name: 'Processes',
    component: ITHygieneProccessesInventoryProcesses,
  },
  {
    id: 'ports',
    name: 'Ports',
    component: ITHygieneProccessesInventoryPorts,
  },
];

export const ITHygieneProcessesInventory = () => {
  return <ITHygieneInventoryTabLayout tabs={tabs} />;
};
