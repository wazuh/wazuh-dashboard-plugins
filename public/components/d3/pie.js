import React, { Component } from 'react';
import * as d3 from "d3";

export class Pie extends Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    componentDidMount() {
        d3.select("body").append("div")
            .attr("class", "tooltip-donut")
            .style("display", 'none')
            .style("position", 'absolute')
            .style("background", '#ffffff')
            .style("padding", '6px')
            .style("border-radius", '5px')
            .style("z-index", 100)
            .style("border", '1px solid #D3DAE6');
    }

    render() {
        const createPie = d3
            .pie()
            .value(d => d.value)
            .sort(null);

        const width = this.props.width;
        const height = this.props.height;
        const data = createPie(this.props.data);
        const colors = this.props.colors || ['#6eadc1','#57c17b','#6f87d8','#663db8','#bc52bc','#9e3533','#daa05d'];
        return (
            <svg width={width} height={height}>
                <g transform={`translate(${(width / 4) - 6} ${height / 2})`}>
                    {data.map((d, i) => (
                        <Slice key={i}
                            innerRadius={33}
                            outerRadius={54}
                            cornerRadius={3}
                            padAngle={0.025}
                            value={d}
                            label={d.id}
                            fill={colors[i]} />
                    ))}
                </g>
                <g transform={`translate(${width / 1.75} 0)`}>
                    {data.map((d, i) => (
                        <g key={i} className="legend" transform={`translate(0 ${15 * (i + 1)})`}>
                            <rect width="10" height="10" fill={colors[i]} stroke={colors[i]}></rect>
                            <text x="15" y="10" style={{ fontSize: 12 }}>{d.data.label}</text>
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

