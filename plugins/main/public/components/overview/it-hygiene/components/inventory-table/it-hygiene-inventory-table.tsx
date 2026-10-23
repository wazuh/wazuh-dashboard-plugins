import React from 'react';
import {
  InventoryDashboardTable,
  InventoryDashboardTableProps,
} from '../../../../common/dashboards';
import { ITHygieneEmptyState } from '../empty-state/it-hygiene-empty-state';

/** Inventory table of IT Hygiene, with its own empty state. */
export const ITHygieneInventoryTable = (
  props: Omit<InventoryDashboardTableProps, 'emptyState'>,
) => (
  <InventoryDashboardTable {...props} emptyState={<ITHygieneEmptyState />} />
);
