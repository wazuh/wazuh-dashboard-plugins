import React, { Component } from 'react';
import * as d3 from 'd3';
import chrome from 'ui/chrome';

export class Pie extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    const isDarkTheme = chrome.getUiSettingsClient().get('theme:darkMode');
    this.pieElement = d3.select('body')
      .append('div')
      .attr('class', 'tooltip-donut')
      .style('display', 'none')
      .style('position', 'absolute')
      .style('background', isDarkTheme ? '#1a1b20' : '#ffffff')
      .style('padding', '6px')
      .style('border-radius', '5px')
      .style('z-index', 100)
      .style('border', '1px solid #D3DAE6');
  }

  componentWillUnmount(){
    this.pieElement && this.pieElement.remove();
  }

  render() {
    const createPie = d3
      .pie()
      .value(d => d.value)
      .sort(null);

    const width = this.props.width;
    const height = this.props.height;
    const data = createPie(this.props.data);
    const colors = this.props.colors || [
      '#6eadc1',
      '#57c17b',
      '#6f87d8',
      '#663db8',
      '#bc52bc',
      '#9e3533',
      '#daa05d'
    ];
    return (
      <svg width={width} height={height}>
        <g transform={`translate(${width / 4 - 6} ${height / 2})`}>
          {data.map((d, i) => (
            <Slice
              key={i}
              innerRadius={42}
              outerRadius={57}
              padAngle={0.025}
              value={d}
              label={d.id}
              fill={colors[i]}
            />
          ))}
        </g>
        <g transform={`translate(${width / 1.75} 0)`}>
          {data.map((d, i) => (
            <g
              key={i}
              className="legend"
              transform={`translate(0 ${15 * (i + 1)})`}
            >
              <rect
                width="10"
                height="10"
                fill={colors[i]}
                stroke={colors[i]}
              ></rect>
              {this.props.legendAction && 
                    <text onClick={() => {this.props.legendAction(d.data.label)}} x="15" y="10" style={{ fontSize: 12, cursor: "pointer" }}>
                      <title>Filter {d.data.label.toLowerCase()} agents</title> 
                      {d.data.label}
                    </text>
              || 

              <text x="15" y="10" style={{ fontSize: 12 }}>
                {d.data.label}
              </text>
                }
            </g>
          ))}
        </g>
      </svg>
    );
  }
}

class Slice extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isHovered: false };
    this.onMouseOver = this.onMouseOver.bind(this);
    this.onMouseOut = this.onMouseOut.bind(this);
  }

  onMouseMove(div, html, ev) {
    div
      .html(html)
      .style('left', ev.pageX + 10 + 'px')
      .style('top', ev.pageY - 15 + 'px');
  }

  onMouseOver(div) {
    this.setState({ isHovered: true });
    div
      .transition()
      .duration(100)
      .style('display', 'block')
      .style('z-index', 100)
      .style('opacity', 1);
  }

  onMouseOut(div) {
    this.setState({ isHovered: false });
    div
      .transition()
      .duration(100)
      .style('z-index', -1)
      .style('opacity', 0);
  }

  lightenDarkenColor(col, amt) {
    let usePound = false;
    if (col[0] == '#') {
      col = col.slice(1);
      usePound = true;
    }
    const num = parseInt(col, 16);
    let r = (num >> 16) + amt;
    if (r > 255) r = 255;
    else if (r < 0) r = 0;
    let b = ((num >> 8) & 0x00ff) + amt;
    if (b > 255) b = 255;
    else if (b < 0) b = 0;
    let g = (num & 0x0000ff) + amt;
    if (g > 255) g = 255;
    else if (g < 0) g = 0;
    return (usePound ? '#' : '') + (g | (b << 8) | (r << 16)).toString(16);
  }

  render() {
    let {
      value,
      label,
      fill,
      innerRadius = 0,
      outerRadius,
      cornerRadius,
      padAngle,
      ...props
    } = this.props;
    if (this.state.isHovered) {
      fill = this.lightenDarkenColor(fill, 50);
    }
    const newValue = { ...value, endAngle: value.endAngle - 0.01 };
    let arc = d3
      .arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .cornerRadius(cornerRadius)
      .padAngle(0.01);

    let div = d3.select('.tooltip-donut');
    const html = `${newValue.data.value} ${newValue.data.label}`;

    return (
      <g
        onMouseOver={() => this.onMouseOver(div)}
        onMouseOut={() => this.onMouseOut(div)}
        onMouseMove={ev => this.onMouseMove(div, html, ev)}
        {...props}
      >
        <path d={arc(newValue)} fill={fill} />
        <text
          transform={`translate(${arc.centroid(newValue)})`}
          dy=".35em"
          className="label"
        >
          {label}
        </text>
      </g>
    );
  }
}
