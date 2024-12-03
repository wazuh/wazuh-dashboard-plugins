import React from 'react';

// eslint-disable-next-line @typescript-eslint/naming-convention, react/display-name
export const withServices = services => WrappedComponent => props => (
  <WrappedComponent {...props} {...services} />
);
