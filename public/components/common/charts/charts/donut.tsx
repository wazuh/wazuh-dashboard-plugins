import React, { useEffect, useRef} from "react";
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

export const ChartDonut = (props : ChartDonutProps) => {
  const pieRef: null | any = useRef();
  const cache = useRef(props.data);
  const [ref, dms] = useChartDimensions({}, pieRef);
  const createPie = d3.layout
    .pie()
    .value(d => d.value)
    .sort(null);
  const createArc = d3.svg
    .arc()
    .innerRadius((dms.width * 0.75) / 2)
    .outerRadius(dms.width * 0.95 / 2)
    .padAngle(0.015);
  const format = d3.format(".2f");

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

    const path = groupWithData.append("path");

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
  },
    [props.data, dms]
  );

  return (
    <svg width={dms.width} height={dms.width}>
      <g
        ref={pieRef}
        transform={`translate(${[
          dms.width / 2,
          dms.width / 2
        ].join(",")})`}
      />
    </svg>
  );
};
