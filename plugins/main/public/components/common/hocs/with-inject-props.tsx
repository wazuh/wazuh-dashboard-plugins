import React from 'react';

/**
 * Inject props to a component
 * @param injectProps
 * @returns
 */
export const withInjectProps =
  (inject: Object | ((props: any) => Object)) => WrappedComponent => props => {
    const injectProps: any =
      typeof inject === 'function' ? inject(props) : inject;
    return <WrappedComponent {...props} {...injectProps} />;
  };
