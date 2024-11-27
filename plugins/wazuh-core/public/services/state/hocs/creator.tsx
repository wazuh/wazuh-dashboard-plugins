import React from 'react';
export const createHOCs = ({ useStateContainer }) => {
  return {
    withStateContainer: (name: string) => WrappedComponent => props => {
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
  };
};
