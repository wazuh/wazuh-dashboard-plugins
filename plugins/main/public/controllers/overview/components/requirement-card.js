/*
 * Wazuh app - React component for building a card to be used for showing compliance requirements.
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
import PropTypes from 'prop-types';
import {
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiCard,
  EuiFlexItem,
  EuiFlexGroup
} from '@elastic/eui';
import { withErrorBoundary } from '../../../components/common/hocs';

export const RequirementCard = withErrorBoundary (class RequirementCard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      position: 0,
      slider: [],
      sliderLength: 0
    };
    this.chunkSize = 4;
    this.chartNum = 250;
    this.expanded = false;
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.items) {
      this.buildSlider();
    }
  }

  buildSlider() {
    const items = this.props.items.map((req, index) => {
      const title = `${this.props.reqTitle}: ${req.title}`;
      const expandMessage = this.expanded ? 'Show less' : 'More info';
      const cardFooterContent = (
        <EuiButtonEmpty
          iconType="iInCircle"
          size="xs"
          className="footer-req wz-margin--10"
          onClick={() => this.expand()}
        >
          {expandMessage}
        </EuiButtonEmpty>
      );
      if (req.content.length >= this.chartNum) {
        const content = this.expanded
          ? req.content
          : `${req.content.substring(0, this.chartNum - 5)}...`;
        return (
          <EuiFlexItem key={index}>
            <EuiCard
              title={title}
              description={content}
              textAlign="left"
              className="wz-padding-bt-5 reqCard"
              footer={cardFooterContent}
            />
          </EuiFlexItem>
        );
      } else {
        return (
          <EuiFlexItem key={index}>
            <EuiCard
              title={title}
              description={req.content}
              textAlign="left"
              className="wz-padding-bt-5 reqCard"
            />
          </EuiFlexItem>
        );
      }
    });

    const slider = this.chunk(items, this.chunkSize);
    const lastArr = slider.length - 1;
    const last = slider[lastArr];
    const rest = this.chunkSize - last.length;
    if (last.length < this.chunkSize) {
      for (let i = 0; i < rest; i++) {
        slider[lastArr].push(
          <EuiFlexItem key={`hidden${i}`}>
            <EuiCard
              title="Title"
              className="hiddenCard"
              description="Description"
              textAlign="left"
            />
          </EuiFlexItem>
        );
      }
    }
    this.setState({ slider: slider, sliderLength: slider.length });
  }

  /**
   * Expands the card to show all info
   */
  expand() {
    this.expanded = !this.expanded;
    this.buildSlider();
  }

  /**
   * Slides to the right the slider
   */
  slideRight() {
    const newPos = this.state.position + 1;
    this.setState({ position: newPos });
  }

  /**
   * Slides to the left the slider
   */
  slideLeft() {
    const newPos = this.state.position - 1;
    this.setState({ position: newPos });
  }

  /**
   * Split an array into smallers array
   * @param {Array} array
   * @param {Number} size
   */
  chunk = (array, size) => {
    const chunked = [];
    for (const item of array) {
      const last = chunked[chunked.length - 1];
      if (!last || last.length === size) {
        chunked.push([item]);
      } else {
        last.push(item);
      }
    }
    return chunked;
  };

  render() {
    if (!this.state.slider.length) this.buildSlider();
    const cards = this.state.slider[this.state.position];
    return (
      <EuiFlexGroup gutterSize="l" className="requirements-cards">
        <EuiButtonIcon
          style={{ margin: '12px 0 12px 12px' }}
          iconType="arrowLeft"
          aria-label="Previous"
          onClick={() => this.slideLeft()}
          isDisabled={this.state.sliderLength <= 1 || this.state.position === 0}
        />
        {cards}
        <EuiButtonIcon
          style={{ margin: '12px 10px 12px 0' }}
          iconType="arrowRight"
          aria-label="Next"
          onClick={() => this.slideRight()}
          isDisabled={
            this.state.sliderLength <= 1 ||
            this.state.position >= this.state.sliderLength - 1
          }
        />
      </EuiFlexGroup>
    );
  }
});

RequirementCard.propTypes = {
  items: PropTypes.array,
  reqTitle: PropTypes.string
};
