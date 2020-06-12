import React from 'react';
import { useWindowSize } from "../hooks/useWindowSize";

export const withWindowSize = (WrappedComponent) => (props) => {
  const windowSize = useWindowSize();
  return <WrappedComponent {...props} windowSize={windowSize}/>
}