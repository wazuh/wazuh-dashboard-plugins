/*
 * Wazuh app - React component for build q queries.
 * Copyright (C) 2015-2019 Wazuh, Inc.
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
import './wz-filter-bar.css';

export class WzFilterBar extends Component {
  constructor(props) {
    super(props);

    this.options = JSON.parse(JSON.stringify(this.props.model));

    this.state = {
      selectedOptions: [],
      toggleIdSelected: 'AND',
      isProcessing: true,
    };

    this.toggleButtons = [
      {
        id: 'AND',
        label: 'AND'
      },
      {
        id: 'OR',
        label: 'OR'
      }
    ];
  }

  onOperatorClick = (ev, option) => {
    ev.preventDefault();
    const selectedOptions = this.state.selectedOptions;
    if (selectedOptions[option].type === 'search') return;
    selectedOptions[option].type =
      selectedOptions[option].type === 'AND' ? 'OR' : 'AND';
    this.setState({
      selectedOptions,
      isProcessing: true,
    });
  };

  componentDidUpdate() {
    if (this.state.isProcessing) {
        for (let i = 0; i < this.state.selectedOptions.length; i++) {
          const el = $('.wzFilterBarOperator .euiBadge__content')[i];
        const hasBtn = $(el).find('.wzFilterBarOperatorBtn');
        if (hasBtn.length) {
          $(hasBtn[0]).remove();
        }
        if (i !== 0) {
          if (this.state.selectedOptions[i].type != 'search') {
            const button = $(
              `<button class="wzFilterBarOperatorBtn euiButtonEmpty euiButtonEmpty--primary euiButtonEmpty--xSmall"><b>${this.state.selectedOptions[i].type}<b></button>`
              );
            button[0].addEventListener('click', ev => {
              this.onOperatorClick(ev, i);
            });
            $(el).prepend(button);
          } else {
            const button = $(
              `<span class="wzFilterBarOperatorBtn"><b>AND<b></button>`
            );
            $(el).prepend(button);
          }
        }
      }
      this.buildQuery();
      this.setState({isProcessing: false });
    }
  }
  
  onChange = selectedOptions => {
    const last = selectedOptions.findIndex(x => {
      return !x.type;
    });

    if (last !== -1) {
      for (let i = 0; i < selectedOptions.length - 1; i++) {
        if (
          selectedOptions[i].label.trim().toLowerCase() ===
            selectedOptions[last].group.trim().toLowerCase() +
              ':' +
              selectedOptions[last].label.trim().toLowerCase() ||
          (selectedOptions[last].type === 'search' &&
            selectedOptions[i].type === 'search')
        )
          return;
      }

      const newFitler = selectedOptions[last];
      newFitler.type = this.state.toggleIdSelected;
      if (!newFitler.label.includes(':')) {
        newFitler.label_ = newFitler.label;
      }

      newFitler.label = selectedOptions[last].group + ':' + newFitler.label_;
      newFitler.className = 'wzFilterBarOperator';
    }
    const model = JSON.parse(JSON.stringify(this.props.model));
    selectedOptions
      .filter(x => {
        return x.type != 'search';
      })
      .forEach(x => {
        const group = model.findIndex(m => {
          const g1 = x.group.toLowerCase();
          const g2 = ((m.options[0] || []).group || '').toLowerCase();
          return g1 === g2;
        });
        if (group != undefined && group != -1) {
          const idx = model[group].options.findIndex(l => {
            return (
              l.label.trim().toLowerCase() === x.label_.trim().toLowerCase()
            );
          });
          if (idx !== -1) model[group].options.splice(idx, 1);
        }
      });

    this.options = model;
    this.setState({
      selectedOptions,
      isProcessing: true,
    });
  };

  onCreateOption = searchValue => {
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
        group: normalizedSearchValue.split(':')[0] || ''
      };
    } else {
      newOption = {
        label: searchValue,
        type: 'search',
        className: 'wzFilterBarOperator'
      };
    }

    // Select the option.
    this.setState(
      prevState => ({
        selectedOptions: prevState.selectedOptions.concat(newOption)
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
        search: ''
      };
      const queryElements = selectedOptions.filter(x => {
        return x.type !== 'search';
      });
      const searchElement = selectedOptions.filter(x => {
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
        queryObj.query += option.label.replace(':', '=');
      });
      if (twoOrMoreElements) {
        queryObj.query += ')';
      }
      this.props.clickAction({ q: queryObj.query, search: queryObj.search });
    } catch (error) {} // eslint-disable-line
  };

  render() {
    return (
      <EuiComboBox
        className="WzFilterBar"
        placeholder="Add filter or search"
        options={this.options}
        selectedOptions={this.state.selectedOptions}
        onChange={this.onChange}
        fullWidth={true}
        onCreateOption={this.onCreateOption}
      />
    );
  }
}

WzFilterBar.propTypes = {
  model: PropTypes.array,
  clickAction: PropTypes.func
};
