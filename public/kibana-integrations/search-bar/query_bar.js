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
const es_query_1 = require("@kbn/es-query");
const classnames_1 = __importDefault(require("classnames"));
const lodash_1 = __importDefault(require("lodash"));
const lodash_2 = require("lodash");
const react_1 = __importStar(require("react"));
const time_history_1 = require("ui/timefilter/time_history");
const eui_1 = require("@elastic/eui");
// @ts-ignore
const eui_2 = require("@elastic/eui");
const react_2 = require("@kbn/i18n/react");
const documentation_links_1 = require("ui/documentation_links");
const notify_1 = require("ui/notify");
const chrome_1 = __importDefault(require("ui/chrome"));
const query_bar_input_1 = require("plugins/data/query/query_bar/components/query_bar_input");
const get_query_log_1 = require("plugins/data/query/query_bar/lib/get_query_log");
const config = chrome_1.default.getUiSettingsClient();
class QueryBarUI extends react_1.Component {
    constructor() {
        super(...arguments);
        /*
         Keep the "draft" value in local state until the user actually submits the query. There are a couple advantages:
      
          1. Each app doesn't have to maintain its own "draft" value if it wants to put off updating the query in app state
          until the user manually submits their changes. Most apps have watches on the query value in app state so we don't
          want to trigger those on every keypress. Also, some apps (e.g. dashboard) already juggle multiple query values,
          each with slightly different semantics and I'd rather not add yet another variable to the mix.
      
          2. Changes to the local component state won't trigger an Angular digest cycle. Triggering digest cycles on every
          keypress has been a major source of performance issues for us in previous implementations of the query bar.
          See https://github.com/elastic/kibana/issues/14086
        */
        this.state = {
            query: {
                query: this.props.query.query,
                language: this.props.query.language,
            },
            inputIsPristine: true,
            currentProps: this.props,
            dateRangeFrom: lodash_1.default.get(this.props, 'dateRangeFrom', 'now-15m'),
            dateRangeTo: lodash_1.default.get(this.props, 'dateRangeTo', 'now'),
            isDateRangeInvalid: false,
        };
        this.inputRef = null;
        this.isDirty = () => {
            if (!this.props.showDatePicker) {
                return this.state.query.query !== this.props.query.query;
            }
            return (this.state.query.query !== this.props.query.query ||
                this.state.dateRangeFrom !== this.props.dateRangeFrom ||
                this.state.dateRangeTo !== this.props.dateRangeTo);
        };
        this.onClickSubmitButton = (event) => {
            if (this.persistedLog) {
                this.persistedLog.add(this.state.query.query);
            }
            this.onSubmit(() => event.preventDefault());
        };
        this.onChange = (query) => {
            this.setState({
                query,
                inputIsPristine: false,
            });
        };
        this.onTimeChange = ({ start, end, isInvalid, isQuickSelection, }) => {
            this.setState({
                dateRangeFrom: start,
                dateRangeTo: end,
                isDateRangeInvalid: isInvalid,
            }, () => isQuickSelection && this.onSubmit());
        };
        this.onSubmit = (preventDefault) => {
            if (preventDefault) {
                preventDefault();
            }
            this.handleLuceneSyntaxWarning();
            time_history_1.timeHistory.add({
                from: this.state.dateRangeFrom,
                to: this.state.dateRangeTo,
            });
            this.props.onSubmit({
                query: {
                    query: this.state.query.query,
                    language: this.state.query.language,
                },
                dateRange: {
                    from: this.state.dateRangeFrom,
                    to: this.state.dateRangeTo,
                },
            });
        };
        this.onInputSubmit = (query) => {
            this.setState({ query }, () => {
                this.onSubmit();
            });
        };
    }
    static getDerivedStateFromProps(nextProps, prevState) {
        if (lodash_2.isEqual(prevState.currentProps, nextProps)) {
            return null;
        }
        let nextQuery = null;
        if (nextProps.query.query !== prevState.query.query) {
            nextQuery = {
                query: nextProps.query.query,
                language: nextProps.query.language,
            };
        }
        else if (nextProps.query.language !== prevState.query.language) {
            nextQuery = {
                query: '',
                language: nextProps.query.language,
            };
        }
        let nextDateRange = null;
        if (nextProps.dateRangeFrom !== lodash_2.get(prevState, 'currentProps.dateRangeFrom') ||
            nextProps.dateRangeTo !== lodash_2.get(prevState, 'currentProps.dateRangeTo')) {
            nextDateRange = {
                dateRangeFrom: nextProps.dateRangeFrom,
                dateRangeTo: nextProps.dateRangeTo,
            };
        }
        const nextState = {
            currentProps: nextProps,
        };
        if (nextQuery) {
            nextState.query = nextQuery;
        }
        if (nextDateRange) {
            nextState.dateRangeFrom = nextDateRange.dateRangeFrom;
            nextState.dateRangeTo = nextDateRange.dateRangeTo;
        }
        return nextState;
    }
    componentDidMount() {
        this.persistedLog = get_query_log_1.getQueryLog(this.props.appName, this.props.query.language);
    }
    componentDidUpdate(prevProps) {
        if (prevProps.query.language !== this.props.query.language) {
            this.persistedLog = get_query_log_1.getQueryLog(this.props.appName, this.props.query.language);
        }
    }
    render() {
        const classes = classnames_1.default('kbnQueryBar', {
            'kbnQueryBar--withDatePicker': this.props.showDatePicker,
        });
        return (react_1.default.createElement(eui_1.EuiFlexGroup, { className: classes, responsive: !!this.props.showDatePicker, gutterSize: "s" },
            react_1.default.createElement(eui_1.EuiFlexItem, null,
                react_1.default.createElement(query_bar_input_1.QueryBarInput, { appName: this.props.appName, disableAutoFocus: this.props.disableAutoFocus, indexPatterns: this.props.indexPatterns, prepend: this.props.prepend, query: this.state.query, screenTitle: this.props.screenTitle, store: this.props.store, onChange: this.onChange, onSubmit: this.onInputSubmit, persistedLog: this.persistedLog })),
            react_1.default.createElement(eui_1.EuiFlexItem, { grow: false }, this.renderUpdateButton())));
    }
    renderUpdateButton() {
        const button = this.props.customSubmitButton ? (react_1.default.cloneElement(this.props.customSubmitButton, { onClick: this.onClickSubmitButton })) : (react_1.default.createElement(eui_2.EuiSuperUpdateButton, { needsUpdate: this.isDirty(), isDisabled: this.state.isDateRangeInvalid, onClick: this.onClickSubmitButton, "data-test-subj": "querySubmitButton" }));
        if (!this.props.showDatePicker) {
            return button;
        }
        return (react_1.default.createElement(eui_1.EuiFlexGroup, { responsive: false, gutterSize: "s" },
            this.renderDatePicker(),
            react_1.default.createElement(eui_1.EuiFlexItem, { grow: false }, button)));
    }
    renderDatePicker() {
        if (!this.props.showDatePicker) {
            return null;
        }
        const recentlyUsedRanges = time_history_1.timeHistory
            .get()
            .map(({ from, to }) => {
            return {
                start: from,
                end: to,
            };
        });
        const commonlyUsedRanges = config
            .get('timepicker:quickRanges')
            .map(({ from, to, display }) => {
            return {
                start: from,
                end: to,
                label: display,
            };
        });
        return (react_1.default.createElement(eui_1.EuiFlexItem, { className: "kbnQueryBar__datePickerWrapper" },
            react_1.default.createElement(eui_1.EuiSuperDatePicker, { start: this.state.dateRangeFrom, end: this.state.dateRangeTo, isPaused: this.props.isRefreshPaused, refreshInterval: this.props.refreshInterval, onTimeChange: this.onTimeChange, onRefreshChange: this.props.onRefreshChange, showUpdateButton: false, recentlyUsedRanges: recentlyUsedRanges, commonlyUsedRanges: commonlyUsedRanges, dateFormat: config.get('dateFormat'), isAutoRefreshOnly: this.props.showAutoRefreshOnly })));
    }
    handleLuceneSyntaxWarning() {
        const { intl, store } = this.props;
        const { query, language } = this.state.query;
        if (language === 'kuery' &&
            typeof query === 'string' &&
            !store.get('kibana.luceneSyntaxWarningOptOut') &&
            es_query_1.doesKueryExpressionHaveLuceneSyntaxError(query)) {
            const toast = notify_1.toastNotifications.addWarning({
                title: intl.formatMessage({
                    id: 'data.query.queryBar.luceneSyntaxWarningTitle',
                    defaultMessage: 'Lucene syntax warning',
                }),
                text: (react_1.default.createElement("div", null,
                    react_1.default.createElement("p", null,
                        react_1.default.createElement(react_2.FormattedMessage, { id: "data.query.queryBar.luceneSyntaxWarningMessage", defaultMessage: "It looks like you may be trying to use Lucene query syntax, although you\r\n               have Kibana Query Language (KQL) selected. Please review the KQL docs {link}.", values: {
                                link: (react_1.default.createElement(eui_1.EuiLink, { href: documentation_links_1.documentationLinks.query.kueryQuerySyntax, target: "_blank" },
                                    react_1.default.createElement(react_2.FormattedMessage, { id: "data.query.queryBar.syntaxOptionsDescription.docsLinkText", defaultMessage: "here" }))),
                            } })),
                    react_1.default.createElement(eui_1.EuiFlexGroup, { justifyContent: "flexEnd", gutterSize: "s" },
                        react_1.default.createElement(eui_1.EuiFlexItem, { grow: false },
                            react_1.default.createElement(eui_1.EuiButton, { size: "s", onClick: () => this.onLuceneSyntaxWarningOptOut(toast) }, "Don't show again"))))),
            });
        }
    }
    onLuceneSyntaxWarningOptOut(toast) {
        this.props.store.set('kibana.luceneSyntaxWarningOptOut', true);
        notify_1.toastNotifications.remove(toast);
    }
}
exports.QueryBarUI = QueryBarUI;
// @ts-ignore
exports.QueryBar = react_2.injectI18n(QueryBarUI);
