import React from 'react';
import { DashboardSavedObject } from './dashboard-saved-object';

export const DashboardVuls = () => {
  const savedObjectId = 'a0859140-3d2f-11ef-8bcd-9dd0603434ee';
  return <DashboardSavedObject savedObjectId={savedObjectId} />;
};
