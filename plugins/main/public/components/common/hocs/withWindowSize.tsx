/*
 * Wazuh app - React HOC to include the window size
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React from 'react';
import { useWindowSize } from "../hooks/useWindowSize";

export const withWindowSize = (WrappedComponent) => (props) => {
  const windowSize = useWindowSize();
  return <WrappedComponent {...props} windowSize={windowSize}/>
}