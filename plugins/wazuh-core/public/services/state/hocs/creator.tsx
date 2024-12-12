import React from 'react';

export const createHOCs = ({ useStateContainer }) => ({
  withStateContainer: (name: string) => (WrappedComponent: React.ElementType) =>
    function WithStateContainer(props: any) {
      const [state, { set: setState, remove: removeState }] =
        useStateContainer(name);

      return (
        <WrappedComponent
          {...props}
          {...{
            [`stateContainer:${name}`]: {
              value: state,
              set: setState,
              remove: removeState,
            },
          }}
        />
      );
    },
});
