/*
 * Wazuh app - React component building the welcome screen of an agent.
 * version, OS, registration date, last keep alive.
 *
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useRef, useEffect } from "react";
import d3 from 'd3';
import { useChartDimensions } from './hooks';


export const RequirementsDonnut = props => {
  const pieRef: null | any = useRef();
  const cache = useRef(props.data);
  const [ref, dms] = useChartDimensions({}, pieRef);
  const createPie = d3.layout
    .pie()
    .value(d => d.doc_count)
    .sort(null);
  const createArc = d3.svg
    .arc()
    .innerRadius((dms.width * 0.75) / 2)
    .outerRadius(dms.width * 0.95 / 2)
    .padAngle(0.015);
  const colors = props.colors;
  const format = d3.format(".2f");

  useEffect(() => {
    const data = createPie(props.data);
    const prevData = createPie(cache.current);
    const group = d3.select(pieRef.current);
    const groupWithData = group.selectAll("g.arc").data(data);

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
      .attr("fill", (d, i) => colors[i])
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

