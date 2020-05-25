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
const eui_1 = require("@elastic/eui");
const es_query_1 = require("@kbn/es-query");
const react_1 = require("@kbn/i18n/react");
const classnames_1 = __importDefault(require("classnames"));
const react_2 = __importStar(require("react"));
const filter_editor_1 = require("plugins/data/filter/filter_bar/filter_editor");
const filter_view_1 = require("./filter_view");
class FilterItemUI extends react_2.Component {
    constructor() {
        super(...arguments);
        this.state = {
            isPopoverOpen: false,
        };
        this.closePopover = () => {
            this.setState({
                isPopoverOpen: false,
            });
        };
        this.togglePopover = () => {
            this.setState({
                isPopoverOpen: !this.state.isPopoverOpen,
            });
        };
        this.onSubmit = (filter) => {
            this.closePopover();
            this.props.onUpdate(filter);
        };
        this.onTogglePinned = () => {
            const filter = es_query_1.toggleFilterPinned(this.props.filter);
            this.props.onUpdate(filter);
        };
        this.onToggleNegated = () => {
            const filter = es_query_1.toggleFilterNegated(this.props.filter);
            this.props.onUpdate(filter);
        };
        this.onToggleDisabled = () => {
            const filter = es_query_1.toggleFilterDisabled(this.props.filter);
            this.props.onUpdate(filter);
        };
    }
    render() {
        const { filter, id } = this.props;
        const { negate, disabled } = filter.meta;
        const classes = classnames_1.default('globalFilterItem', {
            'globalFilterItem-isDisabled': disabled,
            'globalFilterItem-isPinned': es_query_1.isFilterPinned(filter),
            'globalFilterItem-isExcluded': negate,
        }, this.props.className);
        const dataTestSubjKey = filter.meta.key ? `filter-key-${filter.meta.key}` : '';
        const dataTestSubjValue = filter.meta.value ? `filter-value-${filter.meta.value}` : '';
        const dataTestSubjDisabled = `filter-${this.props.filter.meta.disabled ? 'disabled' : 'enabled'}`;
        const badge = (react_2.default.createElement(filter_view_1.FilterView, { filter: filter, className: classes, iconOnClick: () => this.props.onRemove(), onClick: this.togglePopover, "data-test-subj": `filter ${dataTestSubjDisabled} ${dataTestSubjKey} ${dataTestSubjValue}` }));
        const panelTree = [
            {
                id: 0,
                items: [
                    {
                        name: es_query_1.isFilterPinned(filter)
                            ? this.props.intl.formatMessage({
                                id: 'common.ui.filterBar.unpinFilterButtonLabel',
                                defaultMessage: 'Unpin',
                            })
                            : this.props.intl.formatMessage({
                                id: 'common.ui.filterBar.pinFilterButtonLabel',
                                defaultMessage: 'Pin across all apps',
                            }),
                        icon: 'pin',
                        onClick: () => {
                            this.closePopover();
                            this.onTogglePinned();
                        },
                        'data-test-subj': 'pinFilter',
                    },
                    {
                        name: this.props.intl.formatMessage({
                            id: 'common.ui.filterBar.editFilterButtonLabel',
                            defaultMessage: 'Edit filter',
                        }),
                        icon: 'pencil',
                        panel: 1,
                        'data-test-subj': 'editFilter',
                    },
                    {
                        name: negate
                            ? this.props.intl.formatMessage({
                                id: 'common.ui.filterBar.includeFilterButtonLabel',
                                defaultMessage: 'Include results',
                            })
                            : this.props.intl.formatMessage({
                                id: 'common.ui.filterBar.excludeFilterButtonLabel',
                                defaultMessage: 'Exclude results',
                            }),
                        icon: negate ? 'plusInCircle' : 'minusInCircle',
                        onClick: () => {
                            this.closePopover();
                            this.onToggleNegated();
                        },
                        'data-test-subj': 'negateFilter',
                    },
                    {
                        name: disabled
                            ? this.props.intl.formatMessage({
                                id: 'common.ui.filterBar.enableFilterButtonLabel',
                                defaultMessage: 'Re-enable',
                            })
                            : this.props.intl.formatMessage({
                                id: 'common.ui.filterBar.disableFilterButtonLabel',
                                defaultMessage: 'Temporarily disable',
                            }),
                        icon: `${disabled ? 'eye' : 'eyeClosed'}`,
                        onClick: () => {
                            this.closePopover();
                            this.onToggleDisabled();
                        },
                        'data-test-subj': 'disableFilter',
                    },
                    {
                        name: this.props.intl.formatMessage({
                            id: 'common.ui.filterBar.deleteFilterButtonLabel',
                            defaultMessage: 'Delete',
                        }),
                        icon: 'trash',
                        onClick: () => {
                            this.closePopover();
                            this.props.onRemove();
                        },
                        'data-test-subj': 'deleteFilter',
                    },
                ],
            },
            {
                id: 1,
                width: 400,
                content: (react_2.default.createElement("div", null,
                    react_2.default.createElement(filter_editor_1.FilterEditor, { filter: filter, indexPatterns: this.props.indexPatterns, onSubmit: this.onSubmit, onCancel: this.closePopover }))),
            },
        ];
        return (react_2.default.createElement(eui_1.EuiPopover, { id: `popoverFor_filter${id}`, isOpen: this.state.isPopoverOpen, closePopover: this.closePopover, button: badge, anchorPosition: "downLeft", withTitle: true, panelPaddingSize: "none" },
            react_2.default.createElement(eui_1.EuiContextMenu, { initialPanelId: 0, panels: panelTree })));
    }
}
exports.FilterItem = react_1.injectI18n(FilterItemUI);
