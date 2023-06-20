import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';

export class ProgressChart extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.setState({ percent: 0.87 });
  }

  updateData() {
    var value = Math.floor(Math.random() * 80 + 10) / 100;
    this.setState({ percent: value });
  }

  render() {
    var outerRadius = this.props.height / 2 - 10;
    var innerRadius = outerRadius - 20;

    var arc = d3
      .arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .startAngle(0)
      .endAngle(2 * Math.PI);

    var arcLine = d3
      .arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .cornerRadius(20)
      .startAngle(-0.05);

    var transform =
      'translate(' + this.props.width / 2 + ',' + this.props.height / 2 + ')';
    var styleText = {
      fontSize: '22px'
    };
    return (
      <div>
        <svg
          width={this.props.width}
          height={this.props.height}
          onClick={this.updateData}
        >
          <g transform={transform}>
            <path fill={'#F5F7FA'} d={arc()}></path>
            <path
              fill={'#006BB4'}
              d={arcLine({
                endAngle: (2 * Math.PI * this.props.percent.toFixed(0)) / 100
              })}
            ></path>
            <text
              textAnchor="middle"
              dy="6"
              dx="0"
              fill={'#98A2B3'}
              style={styleText}
            >
              {this.props.percent.toFixed(0) + '%'}
            </text>
          </g>
        </svg>
      </div>
    );
  }
}

ProgressChart.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  percent: PropTypes.number
};
