import React from 'react';
import { DashboardSavedObject } from './dashboard-saved-object';

export const DashboardVuls = () => {
  const savedObjectId = 'c69f6ea0-3893-11ef-a08d-93dcf854882b';
  return <DashboardSavedObject savedObjectId={savedObjectId} />;
};
