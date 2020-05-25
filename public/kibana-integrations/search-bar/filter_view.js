"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const eui_1 = require("@elastic/eui");
const es_query_1 = require("@kbn/es-query");
const i18n_1 = require("@kbn/i18n");
const react_1 = __importDefault(require("react"));
const filter_operators_1 = require("plugins/data/filter/filter_bar/filter_editor/lib/filter_operators");
exports.FilterView = ({ filter, ...rest }) => {
    let title = `Filter: ${getFilterDisplayText(filter)}. ${i18n_1.i18n.translate('common.ui.filterBar.moreFilterActionsMessage', {
        defaultMessage: 'Select for more filter actions.'
    })}`;
    if (es_query_1.isFilterPinned(filter)) {
        title = `${i18n_1.i18n.translate('common.ui.filterBar.pinnedFilterPrefix', {
            defaultMessage: 'Pinned'
        })} ${title}`;
    }
    if (filter.meta.disabled) {
        title = `${i18n_1.i18n.translate('common.ui.filterBar.disabledFilterPrefix', {
            defaultMessage: 'Disabled'
        })} ${title}`;
    }
    const isImplicit = typeof filter.meta.removable !== 'undefined' && !!!filter.meta.removable;
    return !isImplicit ? (react_1.default.createElement(eui_1.EuiBadge, Object.assign({ title: title, iconType: "cross", 
        // @ts-ignore
        iconSide: "right", closeButtonProps: {
            // Removing tab focus on close button because the same option can be optained through the context menu
            // Also, we may want to add a `DEL` keyboard press functionality
            tabIndex: '-1'
        }, iconOnClickAriaLabel: i18n_1.i18n.translate('common.ui.filterBar.filterItemBadgeIconAriaLabel', {
            defaultMessage: 'Delete'
        }), onClickAriaLabel: i18n_1.i18n.translate('common.ui.filterBar.filterItemBadgeAriaLabel', {
            defaultMessage: 'Filter actions'
        }) }, rest),
        react_1.default.createElement("span", null, getFilterDisplayText(filter)))) : (react_1.default.createElement(eui_1.EuiBadge, { className: rest.className },
        react_1.default.createElement("span", null, getFilterDisplayText(filter))));
};
function getFilterDisplayText(filter) {
    if (filter.meta.alias !== null) {
        return filter.meta.alias;
    }
    const prefix = filter.meta.negate
        ? ` ${i18n_1.i18n.translate('common.ui.filterBar.negatedFilterPrefix', {
            defaultMessage: 'NOT '
        })}`
        : '';
    switch (filter.meta.type) {
        case 'exists':
            return `${prefix}${filter.meta.key} ${filter_operators_1.existsOperator.message}`;
        case 'geo_bounding_box':
            return `${prefix}${filter.meta.key}: ${filter.meta.value}`;
        case 'geo_polygon':
            return `${prefix}${filter.meta.key}: ${filter.meta.value}`;
        case 'phrase':
            return `${prefix}${filter.meta.key}: ${filter.meta.value}`;
        case 'phrases':
            return `${prefix}${filter.meta.key} ${filter_operators_1.isOneOfOperator.message} ${filter.meta.value}`;
        case 'query_string':
            return `${prefix}${filter.meta.value}`;
        case 'range':
            return `${prefix}${filter.meta.key}: ${filter.meta.value}`;
        default:
            return `${prefix}${JSON.stringify(filter.query)}`;
    }
}
exports.getFilterDisplayText = getFilterDisplayText;
