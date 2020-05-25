"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
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
const eui_1 = require("@elastic/eui");
const es_query_1 = require("@kbn/es-query");
const react_1 = require("@kbn/i18n/react");
const classnames_1 = __importDefault(require("classnames"));
const react_2 = __importStar(require("react"));
const chrome_1 = __importDefault(require("ui/chrome"));
const filter_editor_1 = require("plugins/data/filter/filter_bar/filter_editor");
const filter_item_1 = require("./filter_item");
const filter_options_1 = require("plugins/data/filter/filter_bar/filter_options");
const config = chrome_1.default.getUiSettingsClient();
class FilterBarUI extends react_2.Component {
    constructor() {
        super(...arguments);
        this.state = {
            isAddFilterPopoverOpen: false,
        };
        this.onAdd = (filter) => {
            this.onCloseAddFilterPopover();
            const filters = [...this.props.filters, filter];
            this.props.onFiltersUpdated(filters);
        };
        this.onRemove = (i) => {
            const filters = [...this.props.filters];
            filters.splice(i, 1);
            this.props.onFiltersUpdated(filters);
        };
        this.onUpdate = (i, filter) => {
            const filters = [...this.props.filters];
            filters[i] = filter;
            this.props.onFiltersUpdated(filters);
        };
        this.onEnableAll = () => {
            const filters = this.props.filters.map(es_query_1.enableFilter);
            this.props.onFiltersUpdated(filters);
        };
        this.onDisableAll = () => {
            const filters = this.props.filters.map(es_query_1.disableFilter);
            this.props.onFiltersUpdated(filters);
        };
        this.onPinAll = () => {
            const filters = this.props.filters.map(filter => {
                const shouldExclude = filter &&
                    filter.meta &&
                    typeof filter.meta.removable !== 'undefined' &&
                    !filter.meta.removable;
                return es_query_1.isFilterPinned(filter) || shouldExclude
                    ? filter
                    : es_query_1.toggleFilterPinned(filter);
            });
            this.props.onFiltersUpdated(filters);
        };
        this.onUnpinAll = () => {
            const filters = this.props.filters.map(es_query_1.unpinFilter);
            this.props.onFiltersUpdated(filters);
        };
        this.onToggleAllNegated = () => {
            const filters = this.props.filters.map(es_query_1.toggleFilterNegated);
            this.props.onFiltersUpdated(filters);
        };
        this.onToggleAllDisabled = () => {
            const filters = this.props.filters.map(es_query_1.toggleFilterDisabled);
            this.props.onFiltersUpdated(filters);
        };
        this.isRemovable = item => {
            const property = ((item || {}).meta || {}).removable;
            return typeof property !== 'undefined' && !property;
        };
        this.onRemoveAll = () => {
            const filters = this.props.filters.filter(item => this.isRemovable(item));
            this.props.onFiltersUpdated(filters);
        };
        this.onOpenAddFilterPopover = () => {
            this.setState({
                isAddFilterPopoverOpen: true,
            });
        };
        this.onCloseAddFilterPopover = () => {
            this.setState({
                isAddFilterPopoverOpen: false,
            });
        };
    }
    render() {
        const classes = classnames_1.default('globalFilterBar', this.props.className);
        return (react_2.default.createElement(eui_1.EuiFlexGroup, { className: "globalFilterGroup", gutterSize: "none", alignItems: "flexStart", responsive: false },
            react_2.default.createElement(eui_1.EuiFlexItem, { className: "globalFilterGroup__branch", grow: false },
                react_2.default.createElement(filter_options_1.FilterOptions, { onEnableAll: this.onEnableAll, onDisableAll: this.onDisableAll, onPinAll: this.onPinAll, onUnpinAll: this.onUnpinAll, onToggleAllNegated: this.onToggleAllNegated, onToggleAllDisabled: this.onToggleAllDisabled, onRemoveAll: this.onRemoveAll })),
            react_2.default.createElement(eui_1.EuiFlexItem, null,
                react_2.default.createElement(eui_1.EuiFlexGroup, { className: classes, wrap: true, responsive: false, gutterSize: "xs", alignItems: "center" },
                    this.renderItems(),
                    this.renderAddFilter()))));
    }
    renderItems() {
        return this.props.filters.map((filter, i) => (react_2.default.createElement(eui_1.EuiFlexItem, { key: i, grow: false },
            react_2.default.createElement(filter_item_1.FilterItem, { id: `${i}`, filter: filter, onUpdate: newFilter => this.onUpdate(i, newFilter), onRemove: () => this.onRemove(i), indexPatterns: this.props.indexPatterns }))));
    }
    renderAddFilter() {
        const isPinned = config.get('filters:pinnedByDefault');
        const [indexPattern] = this.props.indexPatterns;
        const index = indexPattern && indexPattern.id;
        const newFilter = es_query_1.buildEmptyFilter(isPinned, index);
        const button = (react_2.default.createElement(eui_1.EuiButtonEmpty, { size: "xs", onClick: this.onOpenAddFilterPopover, "data-test-subj": "addFilter" },
            "+",
            ' ',
            react_2.default.createElement(react_1.FormattedMessage, { id: "common.ui.filterBar.addFilterButtonLabel", defaultMessage: "Add filter" })));
        return (react_2.default.createElement(eui_1.EuiFlexItem, { grow: false },
            react_2.default.createElement(eui_1.EuiPopover, { id: "addFilterPopover", button: button, isOpen: this.state.isAddFilterPopoverOpen, closePopover: this.onCloseAddFilterPopover, anchorPosition: "downLeft", withTitle: true, panelPaddingSize: "none", ownFocus: true },
                react_2.default.createElement(eui_1.EuiFlexItem, { grow: false },
                    react_2.default.createElement("div", { style: { width: 400 } },
                        react_2.default.createElement(filter_editor_1.FilterEditor, { filter: newFilter, indexPatterns: this.props.indexPatterns, onSubmit: this.onAdd, onCancel: this.onCloseAddFilterPopover, key: JSON.stringify(newFilter) }))))));
    }
}
exports.FilterBar = react_1.injectI18n(FilterBarUI);
