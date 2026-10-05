import React from 'react';
import { EuiScreenReaderOnly } from '@elastic/eui';
import { getWzCurrentAppID } from '../../kibana-services';
import { Applications, overview } from '../../utils/applications';

/**
 * Hidden h1 naming the current app, so every page has one. Page titles shown
 * on screen are h2. Overview shows its own h1 with the same name.
 */
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
