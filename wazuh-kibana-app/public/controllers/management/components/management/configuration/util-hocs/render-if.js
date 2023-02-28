/*
 * Wazuh app - HOC, which renders a component if a condition is truthy or a wrapped component. This protects wrapped component of render if the condition returns a truthy value
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

export const withRenderIfOrWrapped = (condition, ComponentIfCondition) => (WrappedComponent) => {
  return (props) => condition(props) ? <ComponentIfCondition {...props}/> : <WrappedComponent {...props}/>
}