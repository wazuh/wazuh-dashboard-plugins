import React, { useEffect } from 'react';
import { AppState } from '../../../react-services';

const withEnableMenu = WrappedComponent => props => {
  useEffect(() => {
    if (!props.location.path.includes('/health-check')) {
      AppState.setWzMenu();
    }
  }, []);

  return <WrappedComponent {...props} />;
};
