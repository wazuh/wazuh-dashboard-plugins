import React from 'react';
// Redux
import WzReduxProvider from '../../../redux/wz-redux-provider';
import WzManagementMain from './management-main';

export const WzManagement = () => {
  return (
    <WzReduxProvider>
      <WzManagementMain />
    </WzReduxProvider>
  );
};
