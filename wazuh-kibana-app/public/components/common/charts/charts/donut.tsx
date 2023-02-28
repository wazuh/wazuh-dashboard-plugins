import React, { useEffect, useRef} from "react";
import ReactDOM from "react-dom";
import d3 from 'd3';
import { useChartDimensions } from '../hooks/use_chart_dimensions';

export type ChartDonutDataEntry = {
  color: string
  value: number
}

export type ChartDonutProps = {
  data: ChartDonutDataEntry[]
}

export type ChartDonutWidgetProps = ChartDonutProps & {
  fetch: () => ChartDonutDataEntry[]
}

/**
 * Create a donut chart.
 */
export const ChartDonut = (props : ChartDonutProps) => {
  const pieRef: null | any = useRef();
  const cache = useRef(props.data);
  const [ref, dms] = useChartDimensions({}, pieRef);
  
  const size = dms.height;
  const outerRadius = size / 2;
  const innerRadius = outerRadius - Math.min(20, size * 0.2);
  let tooltip;
  
  const createPie = d3.layout
    .pie()
    .value(d => d.value)
    .sort(null);
  const createArc = d3.svg
    .arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius)
    .padAngle(0.015);
  const format = d3.format(".2f");

  const TooltipContent = ({ data }) => {
    const borderStyle = { borderLeft: `2px solid ${data.color}` };
    return (
      <div style={borderStyle}>
        <p style={{ marginLeft: '5px', fontSize: '0.8rem' }}>{data.label}: {data.value}</p>
      </div>
    )
  }

  // chart mouse events
  const onEnter = () => {
    tooltip = d3.select("body")
      .append("div")
      .attr("class", "wz-chart-tooltip visTooltip");
  }

  const onMove = (d) => {
    tooltip.style("display", "none");
    tooltip
      .style("left", `${(d3.event.pageX + 12)}px`)
      .style('top', `${(d3.event.pageY - 10)}px`)
      .style("opacity", 1)
      .style("padding", '5px 5px 5px 2px')
      .style("visibility", 'visible')
      .style("position", 'absolute')
      .style("display", "block");
    ReactDOM.render(<TooltipContent data={d.data} />, tooltip[0][0]);
  }

  const onOut = () => d3.select("body > div.wz-chart-tooltip").remove()
  // end of chart mouse events

  useEffect(() => {
    const pieData = createPie(props.data);
    const prevData = createPie(cache.current);
    const group = d3.select(pieRef.current);
    const groupWithData = group.selectAll("g.arc").data(pieData);

    groupWithData.exit().remove();

    
    groupWithData
      .enter()
      .append("g")
      .attr("class", "arc")
      .on("mouseenter", () => onEnter())
      .on("mousemove", (d) => onMove(d))
      .on("mouseout", onOut)
      
    const path = groupWithData.select('path')[0].filter(item => item != null).length ? groupWithData.select("path") : groupWithData.append("path");

    const arcTween = (d, i) => {
      const interpolator = d3.interpolate(prevData[i], d);
      return t => createArc(interpolator(t));
    };

    path
      .attr("class", "arc")
      .attr("fill", (d, i) => props.data[i].color)
      .transition()
      .attrTween("d", arcTween);
    cache.current = props.data;
    return onOut;
  },
    [props.data, dms]
  );

  return (
    <svg width={size} height={size}>
      <g
        ref={pieRef}
        transform={`translate(${[
          size / 2,
          size / 2
        ].join(",")})`}
      />
    </svg>
  );
};
