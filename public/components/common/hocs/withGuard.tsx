/*
 * Wazuh app - React HOC to render a component depending of if it fulfills a condition or the wrapped component instead
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

export const withGuard = (condition, ComponentFulfillsCondition) => WrappedComponent => props => {
  return condition(props) ? <ComponentFulfillsCondition {...props} /> : <WrappedComponent {...props} />
}