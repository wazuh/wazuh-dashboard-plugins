import React from 'react';
export const withServices = services => WrappedComponent => props =>
  <WrappedComponent {...props} {...services} />;
