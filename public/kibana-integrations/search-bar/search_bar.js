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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
const eui_1 = require("@elastic/eui");
const react_1 = require("@kbn/i18n/react");
const classnames_1 = __importDefault(require("classnames"));
const react_2 = __importStar(require("react"));
const resize_observer_polyfill_1 = __importDefault(require("resize-observer-polyfill"));
const query_bar_1 = require("./query_bar");
const filter_bar_1 = require("./filter_bar");
class SearchBarUI extends react_2.Component {
    constructor() {
        super(...arguments);
        this.filterBarRef = null;
        this.filterBarWrapperRef = null;
        this.state = {
            isFiltersVisible: true,
        };
        this.setFilterBarHeight = () => {
            requestAnimationFrame(() => {
                const height = this.filterBarRef && this.state.isFiltersVisible ? this.filterBarRef.clientHeight : 0;
                if (this.filterBarWrapperRef) {
                    this.filterBarWrapperRef.setAttribute('style', `height: ${height}px`);
                }
            });
        };
        // member-ordering rules conflict with use-before-declaration rules
        /* eslint-disable */
        this.ro = new resize_observer_polyfill_1.default(this.setFilterBarHeight);
        /* eslint-enable */
        this.toggleFiltersVisible = () => {
            this.setState({
                isFiltersVisible: !this.state.isFiltersVisible,
            });
        };
    }
    componentDidMount() {
        if (this.filterBarRef) {
            this.setFilterBarHeight();
            this.ro.observe(this.filterBarRef);
        }
    }
    componentDidUpdate() {
        if (this.filterBarRef) {
            this.setFilterBarHeight();
            this.ro.unobserve(this.filterBarRef);
        }
    }
    render() {
        const filtersAppliedText = this.props.intl.formatMessage({
            id: 'data.search.searchBar.filtersButtonFiltersAppliedTitle',
            defaultMessage: 'filters applied.',
        });
        const clickToShowOrHideText = this.state.isFiltersVisible
            ? this.props.intl.formatMessage({
                id: 'data.search.searchBar.filtersButtonClickToShowTitle',
                defaultMessage: 'Select to hide',
            })
            : this.props.intl.formatMessage({
                id: 'data.search.searchBar.filtersButtonClickToHideTitle',
                defaultMessage: 'Select to show',
            });
        const filterTriggerButton = (react_2.default.createElement(eui_1.EuiFilterButton, { onClick: this.toggleFiltersVisible, isSelected: this.state.isFiltersVisible, hasActiveFilters: this.state.isFiltersVisible, numFilters: this.props.filters.length > 0 ? this.props.filters.length : undefined, "aria-controls": "GlobalFilterGroup", "aria-expanded": !!this.state.isFiltersVisible, title: `${this.props.filters.length} ${filtersAppliedText} ${clickToShowOrHideText}` }, "Filters"));
        const classes = classnames_1.default('globalFilterGroup__wrapper', {
            'globalFilterGroup__wrapper-isVisible': this.state.isFiltersVisible,
        });
        return (react_2.default.createElement("div", { className: "globalQueryBar" },
            this.props.showQueryBar ? (react_2.default.createElement(query_bar_1.QueryBar, { query: this.props.query, screenTitle: this.props.screenTitle, onSubmit: this.props.onQuerySubmit, appName: this.props.appName, indexPatterns: this.props.indexPatterns, store: this.props.store, prepend: this.props.showFilterBar ? filterTriggerButton : '', showDatePicker: this.props.showDatePicker, dateRangeFrom: this.props.dateRangeFrom, dateRangeTo: this.props.dateRangeTo, isRefreshPaused: this.props.isRefreshPaused, refreshInterval: this.props.refreshInterval, showAutoRefreshOnly: this.props.showAutoRefreshOnly, onRefreshChange: this.props.onRefreshChange })) : (''),
            this.props.showFilterBar ? (react_2.default.createElement("div", { id: "GlobalFilterGroup", ref: node => {
                    this.filterBarWrapperRef = node;
                }, className: classes },
                react_2.default.createElement("div", { ref: node => {
                        this.filterBarRef = node;
                    } },
                    react_2.default.createElement(filter_bar_1.FilterBar, { className: "globalFilterGroup__filterBar", filters: this.props.filters, onFiltersUpdated: this.props.onFiltersUpdated, indexPatterns: this.props.indexPatterns })))) : ('')));
    }
}
SearchBarUI.defaultProps = {
    showQueryBar: true,
    showFilterBar: true,
};
exports.SearchBar = react_1.injectI18n(SearchBarUI);
