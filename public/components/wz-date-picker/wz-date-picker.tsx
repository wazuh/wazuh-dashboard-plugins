/*
 * Wazuh app - React component for select time and sync with plugin platform discover
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { Fragment, Component } from 'react';
import {
  EuiSuperDatePicker,
  OnTimeChangeProps,
} from '@elastic/eui';
//@ts-ignore
import { CondensedPicker } from './components';
import { getDataPlugin } from '../../kibana-services';

interface IDiscoverTime { from: string, to: string };

export class WzDatePicker extends Component {
  commonDurationRanges = [
    { "start": "now/d", "end": "now/d", "label": "Today" },
    { "start": "now/w", "end": "now/w", "label": "This week" },
    { "start": "now-15m", "end": "now", "label": "Last 15 minutes" },
    { "start": "now-30m", "end": "now", "label": "Last 30 minutes" },
    { "start": "now-1h", "end": "now", "label": "Last 1 hour" },
    { "start": "now-24h", "end": "now", "label": "Last 24 hours" },
    { "start": "now-7d", "end": "now", "label": "Last 7 days" },
    { "start": "now-30d", "end": "now", "label": "Last 30 days" },
    { "start": "now-90d", "end": "now", "label": "Last 90 days" },
    { "start": "now-1y", "end": "now", "label": "Last 1 year" },
  ];

  timefilter: {
    getTime(): IDiscoverTime
    setTime(time: IDiscoverTime): void
    _history: { history: { items: { from: string, to: string }[] } }
  };

  state: {
    datePicker: OnTimeChangeProps,
  };

  props!: {
    onTimeChange(props: OnTimeChangeProps): void
    condensed: boolean
  };

  constructor(props) {
    super(props);
    this.timefilter = getDataPlugin().query.timefilter.timefilter;
    const { from, to } = this.timefilter.getTime();
    this.state = {
      datePicker: {
        start: from,
        end: to,
        isQuickSelection: true,
        isInvalid: false,
      },
    }
  }

  componentDidMount() {
  }

  onTimeChange = (datePicker: OnTimeChangeProps) => {
    const { start: from, end: to } = datePicker;
    this.setState({ datePicker });
    this.timefilter.setTime({ from, to });
    this.props.onTimeChange(datePicker);
  }

  render() {
    const { datePicker } = this.state;
    const recentlyUsedRanges = this.timefilter._history.history.items.map(
      item => ({ start: item.from, end: item.to })
    );
    return !this.props.condensed
      ? <EuiSuperDatePicker
        commonlyUsedRanges={this.commonDurationRanges}
        recentlyUsedRanges={recentlyUsedRanges}
        onTimeChange={this.onTimeChange}
        {...datePicker} />
      : <CondensedPicker
        onTimeChange={this.onTimeChange}
        ranges={this.commonDurationRanges} />
  }
}