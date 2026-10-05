import React from 'react';
import { EuiScreenReaderOnly } from '@elastic/eui';
import { getWzCurrentAppID } from '../../kibana-services';
import { Applications, overview } from '../../utils/applications';

/** Hidden h1 naming the current app; Overview shows its own instead. */
export const WzAppHeading = () => {
  const app = Applications.find(({ id }) => getWzCurrentAppID() === id);

  if (!app || app.id === overview.id) {
    return null;
  }

  return (
    <EuiScreenReaderOnly>
      <h1>{app.title}</h1>
    </EuiScreenReaderOnly>
  );
};
