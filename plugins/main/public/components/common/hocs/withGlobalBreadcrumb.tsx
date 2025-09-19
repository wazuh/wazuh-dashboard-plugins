/*
 * Wazuh app - React HOC for the global breadcrumb
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
import { Breadcrumb, useGlobalBreadcrumb } from '../hooks/useGlobalBreadcrumb';

type BreadcrumbParam = Breadcrumb | ((props: any) => Breadcrumb);

// It returns user permissions
export const withGlobalBreadcrumb =
  (breadcrumbParam: BreadcrumbParam) =>
  (WrappedComponent: React.FC) =>
  (props: any): React.JSX.Element => {
    const getBreadcrumb = () => {
      if (typeof breadcrumbParam === 'function') {
        return breadcrumbParam(props);
      }
      return breadcrumbParam;
    };

    useGlobalBreadcrumb(getBreadcrumb());

    return <WrappedComponent {...props} />;
  };
