import { useState, useEffect } from 'react';
import { ApiAvailableUpdates, AvailableUpdates } from '../../common/types';
import { routes } from '../../common/constants';
import { getCore } from '../plugin-services';

export const getAvailableUpdates = async (forceUpdate = false): Promise<AvailableUpdates> => {
  const checkUpdates = sessionStorage.getItem('checkUpdates');
  const alreadyCheckUpdates = checkUpdates === 'executed';

  const availableUpdates = await getCore().http.get(routes.checkUpdates, {
    query: {
      checkAvailableUpdates: forceUpdate || !alreadyCheckUpdates,
    },
  });

  if (!alreadyCheckUpdates) {
    sessionStorage.setItem('checkUpdates', 'executed');
  }

  return availableUpdates;
};
