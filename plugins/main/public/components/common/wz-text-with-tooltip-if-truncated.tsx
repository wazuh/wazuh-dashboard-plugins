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

import {
  EuiToolTip
} from '@elastic/eui';

interface IWzTextWithTooltipIfTruncated{
  children: JSX.Element
  tooltip?: string
  elementStyle?: object
  tooltipProps?: object
  position?: string // same options as EuiTooltip's position
}

export default class WzTextWithTooltipIfTruncated extends Component<IWzTextWithTooltipIfTruncated> {
  state: {
    withTooltip: boolean;
  };
  static defaultProps = {
    elementStyle: {}
  }
  timer?: ReturnType<typeof setTimeout>
  reference: any
  constructor(props) {
    super(props);
    this.reference = React.createRef<HTMLSpanElement>();
    this.state = {
      withTooltip: false
    };
  }
  componentDidMount() {
    this.timer = setTimeout(() => { //TODO: remove timer and setTimeout function. It is needed while this component is mounted through the AngularJS react-component directive.
      // HTML element reference with text (maybe truncated)
      const reference = this.reference.current;
      // HTML element clone of reference
      const clone = reference.cloneNode(true);
      clone.style.display = "inline";
      clone.style.width = "auto";
      clone.style.visibility = "hidden";
      clone.style.maxWidth = "none";
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
    })
  }
  componentWillUnmount(){
    this.timer && clearTimeout(this.timer);
  }
  buildContent() {  
    return (      
      <span
        ref={this.reference}
        style={{
            display: "block",
            overflow: "hidden",
            paddingBottom: "3px",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            ...this.props.elementStyle
          }}
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
      >
        {this.buildContent()}
      </EuiToolTip>
    ) : (
      this.buildContent()
    );
  }
};
