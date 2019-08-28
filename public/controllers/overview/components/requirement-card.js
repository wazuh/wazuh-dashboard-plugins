import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiCard,
  EuiFlexItem,
  EuiFlexGroup
} from '@elastic/eui';

export class RequirementCard extends Component {
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
      <div>
        <EuiFlexGroup 
          gutterSize="l"
          className="requirements-cards"  
        >
          {this.state.sliderLength > 1 && this.state.position > 0 && (
            <EuiButtonIcon
              className="wz-margin-left-10"
              iconType="arrowLeft"
              aria-label="Previous"
              onClick={() => this.slideLeft()}
            />
          )}
          {cards}
          {this.state.sliderLength > 1 &&
            this.state.position < this.state.sliderLength - 1 && (
              <EuiButtonIcon
                className="wz-margin-right-10"
                iconType="arrowRight"
                aria-label="Next"
                onClick={() => this.slideRight()}
              />
            )}
        </EuiFlexGroup>
      </div>
    );
  }
}

RequirementCard.propTypes = {
  items: PropTypes.array,
  reqTitle: PropTypes.string
};
