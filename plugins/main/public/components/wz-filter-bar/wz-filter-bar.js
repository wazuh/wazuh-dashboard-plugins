/*
 * Wazuh app - React component for build q queries.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react';
import { EuiComboBox } from '@elastic/eui';
import PropTypes from 'prop-types';
import './wz-filter-bar.scss';
import { withErrorBoundary } from '../common/hocs';
import { UI_LOGGER_LEVELS } from '../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../react-services/common-services';

export const WzFilterBar = withErrorBoundary(
  class WzFilterBar extends Component {
    constructor(props) {
      super(props);
      const { model, selectedOptions } = this.props;
      this.state = {
        selectedOptions: selectedOptions || [],
        toggleIdSelected: 'AND',
        isProcessing: true,
        options: model,
      };
      this.toggleButtons = [
        {
          id: 'AND',
          label: 'AND',
        },
        {
          id: 'OR',
          label: 'OR',
        },
      ];
      this.refComboBox = React.createRef();
    }

    onOperatorClick = (ev, option) => {
      ev.preventDefault();
      const selectedOptions = this.state.selectedOptions;
      if (selectedOptions[option].type === 'search') return;
      selectedOptions[option].type = selectedOptions[option].type === 'AND' ? 'OR' : 'AND';
      this.setState({
        isProcessing: true,
        selectedOptions,
      });
    };

    componentDidUpdate(prevProps) {
      if (JSON.stringify(this.state.selectedOptions) !== JSON.stringify(this.props.selectedOptions))
        this.setState({
          isProcessing: true,
          selectedOptions: this.props.selectedOptions,
        });

      const { model } = this.props;
      if (JSON.stringify(prevProps.model) !== JSON.stringify(model)) {
        const { selectedOptions } = this.state;
        this.clearSeletedOptions(model, selectedOptions);

        for (const selectedOption of selectedOptions) {
          for (const group of model) {
            let flag = false;
            for (const option of group.options) {
              if (selectedOption.group === option.group) {
                flag = true;
                break;
              }
            }
            if (flag) {
              group.options.push(selectedOption);
              break;
            }
          }
        }

        this.setState({ options: model });
      }
      if (this.state.isProcessing) {
        for (const i in this.state.selectedOptions) {
          if (this.state.selectedOptions.hasOwnProperty(i)) {
            const selectedOptions = this.state.selectedOptions[i];
            const el = $('.wzFilterBarOperator .euiBadge__content')[i];
            const hasBtn = $(el).find('.wzFilterBarOperatorBtn');
            if (hasBtn.length) {
              $(hasBtn[0]).remove();
            }
            if (i != 0) {
              if (selectedOptions.type != 'search') {
                const button = $(
                  `<button class="wzFilterBarOperatorBtn euiButtonEmpty euiButtonEmpty--primary euiButtonEmpty--xSmall"><b>${selectedOptions.type}<b></button>`
                );
                button[0].addEventListener('click', (ev) => {
                  this.onOperatorClick(ev, i);
                });
                $(el).prepend(button);
              } else {
                const button = $(`<span class="wzFilterBarOperatorBtn"><b>AND<b></button>`);
                $(el).prepend(button);
              }
            }
          }
        }
        this.buildQuery();
        this.setState({ isProcessing: false });
        this.refComboBox.current.closeList();
      }
    }

    checkIfExistsOrIsSearch(selectedOptions, last) {
      const { group, label, type } = selectedOptions[last];
      const lastOption = `${group.trim().toLowerCase()}:${label.trim().toLowerCase()}`;

      for (const option of selectedOptions) {
        const isSelected = option.label.trim().toLowerCase() === lastOption;
        const isSearch = type === 'search' && option.type === 'search';
        if (isSelected || isSearch) {
          return true;
        }
      }
    }

    encodeFilter(option) {
      const newFilter = option;

      newFilter.type = this.state.toggleIdSelected;
      if (!newFilter.label.includes(':')) {
        newFilter.label_ = newFilter.label;
      }

      newFilter.label = option.group + ':' + newFilter.label_;
      newFilter.className = 'wzFilterBarOperator';
    }

    decodeFilters(options, selectedOptions) {
      const labels = selectedOptions.map((item) => {
        return item.label_;
      });
      for (const groups of options) {
        for (const option of groups.options) {
          if (option.label.includes(':') && !labels.includes(option.label_)) {
            option.label = option.label_;
            delete option.type;
            delete option.label_;
            delete option.className;
          }
        }
      }
    }

    clearSeletedOptions(options, selectedOptions) {
      selectedOptions
        .filter((x) => {
          return x.type != 'search';
        })
        .forEach((x) => {
          const group = options.findIndex((m) => {
            const g1 = x.group.toLowerCase();
            const g2 = ((m.options[0] || []).group || '').toLowerCase();
            return g1 === g2;
          });
          if (group != undefined && group != -1) {
            const idx = options[group].options.findIndex((l) => {
              return l.label.trim().toLowerCase() === x.label_.trim().toLowerCase();
            });
            if (idx !== -1) options[group].options.splice(idx, 1);
          }
        });
    }

    onChange = (selectedOptions) => {
      const last = selectedOptions.findIndex((x) => {
        return !x.type;
      });

      if (last !== -1) {
        if (this.checkIfExistsOrIsSearch(selectedOptions, last)) {
          return;
        }

        this.encodeFilter(selectedOptions[last]);
      }

      const options = this.state.options;
      this.clearSeletedOptions(options, selectedOptions);
      this.decodeFilters(options, selectedOptions);

      this.setState({
        isProcessing: true,
        selectedOptions,
        options,
      });
    };

    onCreateOption = (searchValue) => {
      if (!searchValue) {
        return;
      }

      const normalizedSearchValue = searchValue.trim().toLowerCase();

      if (!normalizedSearchValue) {
        return;
      }

      let newOption = {};

      if (normalizedSearchValue.includes(':')) {
        newOption = {
          label: normalizedSearchValue.split(':')[1] || '',
          group: normalizedSearchValue.split(':')[0] || '',
        };
      } else {
        newOption = {
          label: searchValue,
          type: 'search',
          className: 'wzFilterBarOperator',
        };
      }

      // Select the option.
      this.setState(
        (prevState) => ({
          selectedOptions: prevState.selectedOptions.concat(newOption),
        }),
        () => {
          if (searchValue.includes(':')) {
            this.onChange(this.state.selectedOptions);
          }
        }
      );
      this.setState({ isProcessing: true });
    };

    buildQuery = () => {
      try {
        const selectedOptions = this.state.selectedOptions;
        const queryObj = {
          query: '',
          search: '',
        };
        const queryElements = selectedOptions.filter((x) => {
          return x.type !== 'search';
        });
        const searchElement = selectedOptions.filter((x) => {
          return x.type === 'search';
        });
        if (searchElement.length) {
          queryObj.search = searchElement[0].label;
        }
        const twoOrMoreElements = queryElements.length > 1;
        if (twoOrMoreElements) {
          queryObj.query += '(';
        }
        queryElements.forEach((option, idx) => {
          if (idx != 0) {
            queryObj.query += option.type === 'AND' ? ';' : ',';
          }
          queryObj.query += option.query ? option.query : option.label.replace(':', '=');
        });
        if (twoOrMoreElements) {
          queryObj.query += ')';
        }
        this.props.clickAction({
          q: queryObj.query,
          search: queryObj.search,
          selectedOptions: selectedOptions,
        });
      } catch (error) {
        const options = {
          context: `${WzFilterBar.name}.buildQuery`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          error: {
            error: error,
            message: error.message || error,
            title: error.name || error,
          },
        };
        getErrorOrchestrator().handleError(options);
      } // eslint-disable-line
    };

    render() {
      const { options, selectedOptions } = this.state;
      return (
        <EuiComboBox
          className="wz-search-bar"
          placeholder="Add filter or search"
          options={options}
          selectedOptions={selectedOptions}
          onChange={this.onChange}
          fullWidth={true}
          onCreateOption={this.onCreateOption}
          ref={this.refComboBox}
        />
      );
    }
  }
);

WzFilterBar.propTypes = {
  clickAction: PropTypes.func,
  model: PropTypes.array,
  selectedOptions: PropTypes.array,
};
