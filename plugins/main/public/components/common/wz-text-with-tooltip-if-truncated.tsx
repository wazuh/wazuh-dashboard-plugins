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

  componentDidUpdate() {
    this.timer = setTimeout(() => {
      // HTML element reference with text (maybe truncated)
      const reference = this.contentReference.current as HTMLElement;
      // HTML element clone of reference
      const clone = reference.cloneNode(true) as HTMLElement;
      clone.style.display = 'inline';
      clone.style.width = 'auto';
      clone.style.visibility = 'hidden';
      clone.style.maxWidth = 'none';
      // Insert clone in DOM appending as sibling of reference to measure both
      // reference.parentNode.appendChild(clone);
      // Insert clone in DOM as body child
      document.body.appendChild(clone);
      // Compare widths
      if (reference.offsetWidth < clone.offsetWidth) {
        // Set withTooltip to true to render truncated element with a tooltip
        this.setState({ withTooltip: true });
      }
      // Remove clone of DOM
      clone.remove();
    });
  }

  componentWillUnmount() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  buildContent() {
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
        {this.buildContent()}
      </EuiToolTip>
    ) : (
      this.buildContent()
    );
  }
}
