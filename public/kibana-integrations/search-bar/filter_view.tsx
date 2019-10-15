/*
 * Author: Elasticsearch B.V.
 * Updated by Wazuh, Inc.
 *
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { EuiBadge } from '@elastic/eui';
import { Filter, isFilterPinned } from '@kbn/es-query';
import { i18n } from '@kbn/i18n';
import React, { SFC } from 'react';
import {
  existsOperator,
  isOneOfOperator
} from 'ui/filter_bar/filter_editor/lib/filter_operators';

interface Props {
  filter: Filter;
  [propName: string]: any;
}

export const FilterView: SFC<Props> = ({ filter, ...rest }: Props) => {
  let title = `Filter: ${getFilterDisplayText(filter)}. ${i18n.translate(
    'common.ui.filterBar.moreFilterActionsMessage',
    {
      defaultMessage: 'Select for more filter actions.'
    }
  )}`;

  if (isFilterPinned(filter)) {
    title = `${i18n.translate('common.ui.filterBar.pinnedFilterPrefix', {
      defaultMessage: 'Pinned'
    })} ${title}`;
  }
  if (filter.meta.disabled) {
    title = `${i18n.translate('common.ui.filterBar.disabledFilterPrefix', {
      defaultMessage: 'Disabled'
    })} ${title}`;
  }

  const isImplicit =
    typeof filter.meta.removable !== 'undefined' && !!!filter.meta.removable;

  return !isImplicit ? (
    <EuiBadge
      title={title}
      iconType="cross"
      // @ts-ignore
      iconSide="right"
      closeButtonProps={{
        // Removing tab focus on close button because the same option can be optained through the context menu
        // Also, we may want to add a `DEL` keyboard press functionality
        tabIndex: '-1'
      }}
      iconOnClickAriaLabel={i18n.translate(
        'common.ui.filterBar.filterItemBadgeIconAriaLabel',
        {
          defaultMessage: 'Delete'
        }
      )}
      onClickAriaLabel={i18n.translate(
        'common.ui.filterBar.filterItemBadgeAriaLabel',
        {
          defaultMessage: 'Filter actions'
        }
      )}
      {...rest}
    >
      <span>{getFilterDisplayText(filter)}</span>
    </EuiBadge>
  ) : (
    <EuiBadge
      className={rest.className}
    >
      <span>{getFilterDisplayText(filter)}</span>
    </EuiBadge>
  );
};

export function getFilterDisplayText(filter: Filter) {
  if (filter.meta.alias !== null) {
    return filter.meta.alias;
  }

  const prefix = filter.meta.negate
    ? ` ${i18n.translate('common.ui.filterBar.negatedFilterPrefix', {
        defaultMessage: 'NOT '
      })}`
    : '';

  switch (filter.meta.type) {
    case 'exists':
      return `${prefix}${filter.meta.key} ${existsOperator.message}`;
    case 'geo_bounding_box':
      return `${prefix}${filter.meta.key}: ${filter.meta.value}`;
    case 'geo_polygon':
      return `${prefix}${filter.meta.key}: ${filter.meta.value}`;
    case 'phrase':
      return `${prefix}${filter.meta.key}: ${filter.meta.value}`;
    case 'phrases':
      return `${prefix}${filter.meta.key} ${isOneOfOperator.message} ${
        filter.meta.value
      }`;
    case 'query_string':
      return `${prefix}${filter.meta.value}`;
    case 'range':
      return `${prefix}${filter.meta.key}: ${filter.meta.value}`;
    default:
      return `${prefix}${JSON.stringify(filter.query)}`;
  }
}
