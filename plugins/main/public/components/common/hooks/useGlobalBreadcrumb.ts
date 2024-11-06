/*
 * Wazuh app - React hook to manage global breadcrumb
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { updateGlobalBreadcrumb } from '../../../redux/actions/globalBreadcrumbActions';
import { Agent } from '../../endpoints-summary/types';

export type BreadcrumbItem = { text: string; href?: string } | { agent: Agent };
export type Breadcrumb = BreadcrumbItem[];

// It updates global breadcrumb
export const useGlobalBreadcrumb = (breadcrumb: Breadcrumb = []) => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(updateGlobalBreadcrumb(breadcrumb));
  });
};
