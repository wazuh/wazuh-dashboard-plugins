import React from 'react';
export const createHOCs = ({ useStateContainer }) => {
  return {
    withStateContainer: (name: string) => WrappedComponent => props => {
      const [state, setState, removeValue] = useStateContainer(name);
      return (
        <WrappedComponent
          {...props}
          {...{
            [`stateContainer:${name}`]: {
              value: state,
              set: setState,
              remove: removeValue,
            },
          }}
        />
      );
    },
  };
};
