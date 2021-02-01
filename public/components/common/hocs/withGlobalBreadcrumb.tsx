/*
 * Wazuh app - React HOC for the global breadcrumb
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { useEffect } from 'react';
import { useGlobalBreadcrumb  } from '../hooks/useGlobalBreadcrumb';

type TBreadcrumbSection = {text: string, href?: string} 
type TBreadcrumb = TBreadcrumbSection[];
type TBreadcrumbParameter = TBreadcrumb | ((props: any) => TBreadcrumb);

// It retuns user permissions
export const withGlobalBreadcrumb = (breadcrumb : TBreadcrumbParameter) => WrappedComponent => props => {
  useGlobalBreadcrumb(typeof breadcrumb === 'function' ? breadcrumb(props) : breadcrumb);
  return <WrappedComponent {...props} />
}