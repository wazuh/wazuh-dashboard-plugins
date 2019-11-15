/*
 * Wazuh app - React component for building the agents preview section.
 *
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
import PropTypes from 'prop-types';
import {
  EuiPage,
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiStat,
  EuiTitle,
  EuiIcon
} from '@elastic/eui';
import * as d3 from "d3";
import { AgentsTable } from './agents-table'

export class AgentsPreview extends Component {

  constructor(props) {
    super(props);
    this.state = { data: [] }
  }

  initialize() {
    d3.select("body").append("div")
      .attr("class", "tooltip-donut")
      .style("display", 'none')
      .style("position", 'absolute')
      .style("background", '#ffffff')
      .style("padding", '6px')
      .style("border-radius", '5px')
      .style("z-index", 100)
      .style("border", '1px solid #D3DAE6');
    this.getSummary();
  }

  componentDidMount() {
    this.initialize();
  }

  groupBy = function (xs, key) {
    return xs.reduce(function (rv, x) {
      (rv[x[key]] = rv[x[key]] || []).push(x);
      return rv;
    }, {});
  };

  async getSummary() {
    try {
      const result = await this.props.tableProps.wzReq('GET', '/agents', { select: 'status', q: 'id!=000' });
      this.totalAgents = result.data.data.totalItems;
      const lastAgent = await this.props.tableProps.wzReq('GET', '/agents', { limit: 1, sort: '-dateAdd' });
      this.lastAgent = lastAgent.data.data.items[0];
      this.summary = this.groupBy(result.data.data.items, 'status');
      this.agentsCoverity = this.totalAgents ? ((this.summary['Active'] || []).length / this.totalAgents) * 100 : 0;
      const model = [
        { id: 'active', label: "Active", value: (this.summary['Active'] || []).length },
        { id: 'disconnected', label: "Disconnected", value: (this.summary['Disconnected'] || []).length },
        { id: 'neverConnected', label: "Never connected", value: (this.summary['Never connected'] || []).length }
      ];
      this.setState({ data: model });
    } catch (error) { }
  }

  render() {

    const createPie = d3
      .pie()
      .value(d => d.value)
      .sort(null);

    const colors = ["#017D73", "#bd271e", "#69707D"];
    const data = createPie(this.state.data);

    return (
      <EuiPage>

        <EuiFlexGroup>
          <EuiFlexItem grow={false} style={{ width: 300 }}>
            <EuiPanel>
              <EuiFlexGroup>
                <EuiFlexItem grow={false}>
                  <EuiIcon size={'l'} type={'monitoringApp'} />
                </EuiFlexItem>
                <EuiFlexItem style={{ marginLeft: 0 }}>
                  <EuiTitle size={'s'}>
                    <h2>Global status</h2>
                  </EuiTitle>
                </EuiFlexItem>
              </EuiFlexGroup>
              <svg width={266} height={150}>
                <g transform={`translate(${133} ${70})`}>
                  {data.map((d, i) => (
                    <Slice key={i}
                      innerRadius={60}
                      outerRadius={40}
                      cornerRadius={3}
                      padAngle={0.025}
                      value={d}
                      label={d.id}
                      fill={colors[i]} />
                  ))}
                </g>
              </svg>
              {(this.summary &&
                <div>
                  <EuiFlexGroup>

                    <EuiFlexItem>
                      <EuiStat
                        title={this.totalAgents}
                        textAlign="center"
                        description="Total agents"
                        titleColor="primary"
                      />
                    </EuiFlexItem>
                    <EuiFlexItem>
                      <EuiStat
                        title={this.state.data[0].value}
                        textAlign="center"
                        description="Active"
                        titleColor="secondary"
                      />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                  <EuiFlexGroup>
                    <EuiFlexItem>
                      <EuiStat
                        title={this.state.data[1].value}
                        textAlign="center"
                        description="Disconnected"
                        titleColor="danger"
                      />
                    </EuiFlexItem>
                    <EuiFlexItem>
                      <EuiStat
                        title={this.state.data[2].value}
                        textAlign="center"
                        description="Never connected"
                        titleColor="subdued"
                      />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </div>
              )}
            </EuiPanel>
            <EuiPanel style={{ marginTop: 12 }}>
              <EuiFlexGroup>
                <EuiFlexItem grow={false}>
                  <EuiIcon size={'l'} type={'dataVisualizer'} />
                </EuiFlexItem>
                <EuiFlexItem style={{ marginLeft: 0 }}>
                  <EuiTitle size={'s'}>
                    <h2>Details</h2>
                  </EuiTitle>
                </EuiFlexItem>
              </EuiFlexGroup>
              {(this.agentsCoverity &&
                <div>
                  <EuiStat style={{ paddingTop: 10 }}
                    title=''
                    textAlign="center"
                    description="Agents coverage"
                    titleColor="primary"
                  />
                  <ProgressChart width={266} height={125} percent={this.agentsCoverity}></ProgressChart>
                  <EuiFlexGroup style={{ marginTop: 0 }}>
                    <EuiFlexItem>
                      <EuiStat
                        className='euiStatLink'
                        title={this.lastAgent.name}
                        titleSize="s"
                        textAlign="center"
                        description="Last registered agent"
                        titleColor="primary"
                        onClick={() => this.props.tableProps.showAgent(this.lastAgent)}
                      />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                  <EuiFlexGroup>
                    <EuiFlexItem>
                      <EuiStat
                        className='euiStatLink'
                        title='agent'
                        titleSize="s"
                        textAlign="center"
                        description="Most active agent"
                        titleColor="primary"
                        onClick={() => this.props.tableProps.showAgent(this.lastAgent)}
                      />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </div>
              )}
            </EuiPanel>
          </EuiFlexItem>
          <EuiFlexItem style={{ 'marginLeft': 4 }}>
            <AgentsTable
              wzReq={this.props.tableProps.wzReq}
              addingNewAgent={this.props.tableProps.addingNewAgent}
              downloadCsv={this.props.tableProps.downloadCsv}
              clickAction={this.props.tableProps.clickAction}
              timeService={this.props.tableProps.timeService}
              reload={() => this.initialize()}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPage>
    );
  }
}

AgentsTable.propTypes = {
  tableProps: PropTypes.object,
  showAgent: PropTypes.func
};

class Slice extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isHovered: false };
    this.onMouseOver = this.onMouseOver.bind(this);
    this.onMouseOut = this.onMouseOut.bind(this);
  }

  onMouseMove(div, html, ev) {
    div.html(html)
      .style("left", (ev.pageX + 10) + "px")
      .style("top", (ev.pageY - 15) + "px");
  }

  onMouseOver(div) {
    this.setState({ isHovered: true });
    div.transition()
      .duration(100)
      .style("display", "block")
      .style("z-index", 100)
      .style("opacity", 1);
  }

  onMouseOut(div) {
    this.setState({ isHovered: false });
    div.transition()
      .duration(100)
      .style("z-index", -1)
      .style("opacity", 0);
  }

  render() {
    let { value, label, fill, innerRadius = 0, outerRadius, cornerRadius, padAngle, ...props } = this.props;
    if (this.state.isHovered) {
      innerRadius *= 1.05;
      fill = fill + 'ee';
    }
    let arc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .cornerRadius(cornerRadius)
      .padAngle(padAngle);

    let div = d3.select(".tooltip-donut");
    const html = `${value.data.value} ${value.data.label}`;

    return (
      <g onMouseOver={() => this.onMouseOver(div)}
        onMouseOut={() => this.onMouseOut(div)} onMouseMove={(ev) => this.onMouseMove(div, html, ev)}
        {...props}>
        <path d={arc(value)} fill={fill} />
        <text transform={`translate(${arc.centroid(value)})`}
          dy=".35em"
          className="label">
          {label}
        </text>
      </g>
    );
  }
}


class ProgressChart extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.setState({ percent: .87 });
  }

  updateData() {
    var value = (Math.floor(Math.random() * (80) + 10)) / 100;
    this.setState({ percent: value });
  }

  render() {
    var outerRadius = (this.props.height / 2) - 10;
    var innerRadius = outerRadius - 20;

    var arc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .startAngle(0)
      .endAngle(2 * Math.PI);

    var arcLine = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .cornerRadius(20)
      .startAngle(-0.05);

    var transform = 'translate(' + this.props.width / 2 + ',' + this.props.height / 2 + ')';
    var styleText = {
      'fontSize': '22px'
    };
    return (
      <div>
        <svg width={this.props.width}
          height={this.props.height} onClick={this.updateData}>
          <g transform={transform}>
            <path fill={'#F5F7FA'} d={arc()}></path>
            <path fill={'#006BB4'} d={arcLine({ endAngle: (2 * Math.PI) * this.props.percent.toFixed(0) / 100 })}></path>
            <text textAnchor="middle" dy="6" dx="0" fill={'#98A2B3'}
              style={styleText}>{this.props.percent.toFixed(0) + '%'}</text>
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
}