import React from 'react';

export const withServices =
  services => (WrappedComponent: React.ElementType) => {
    const ComponentWithServices = (props: any) => (
      <WrappedComponent {...props} {...services} />
    );

    ComponentWithServices.displayName = `WithServices(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

    return ComponentWithServices;
  };
