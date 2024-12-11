/*
 * Wazuh app - React component for building the management welcome screen.
 *
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
import { EuiToolTip } from '@elastic/eui';
import './wz-text-with-tooltip-if-truncated.scss';

interface WzTextWithTooltipIfTruncatedProps extends React.PropsWithChildren {
  tooltip?: string;
  contentStyle?: React.CSSProperties;
  tooltipProps?: object;
}

export default class WzTextWithTooltipIfTruncated extends Component<WzTextWithTooltipIfTruncatedProps> {
  static defaultProps = {
    contentStyle: {},
  };
  state: {
    withTooltip: boolean;
  };
  timer?: ReturnType<typeof setTimeout>;
  contentReference: React.RefObject<HTMLElement>;

  constructor(props: WzTextWithTooltipIfTruncatedProps) {
    super(props);
    this.contentReference = React.createRef<HTMLElement>();
    this.state = {
      withTooltip: false,
    };
  }

  /**
   * The function `createClone` creates a clone of an HTML element with specific
   * styling properties.
   * @param {HTMLElement} reference - The `reference` parameter in the `createClone`
   * function is an HTMLElement that serves as the reference element from which a
   * clone will be created.
   * @returns The function `createClone` returns a clone of the provided
   * `HTMLElement` reference with specific styles applied.
   */
  createClone(reference: HTMLElement) {
    // HTML element clone of reference
    const clone = reference.cloneNode(true) as HTMLElement;
    clone.style.display = 'inline';
    clone.style.width = 'auto';
    clone.style.visibility = 'hidden';
    clone.style.maxWidth = 'none';
    return clone;
  }

  componentDidUpdate() {
    this.timer = setTimeout(() => {
      const reference = this.contentReference.current as HTMLElement;
      const clone = this.createClone(reference);
      document.body.appendChild(clone);
      this.setState({
        withTooltip: reference.offsetWidth < clone.offsetWidth,
      });
      clone.remove();
    });
  }

  componentWillUnmount() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  renderContent() {
    return (
      <span
        ref={this.contentReference}
        className='wz-text-content'
        style={this.props.contentStyle}
      >
        {this.props.children || this.props.tooltip}
      </span>
    );
  }

  render() {
    return this.state.withTooltip ? (
      <EuiToolTip
        content={this.props.tooltip || this.props.children}
        {...this.props.tooltipProps}
        anchorClassName='wz-width-100'
      >
        {this.renderContent()}
      </EuiToolTip>
    ) : (
      this.renderContent()
    );
  }
}
