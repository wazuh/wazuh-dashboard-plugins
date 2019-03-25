/*
 * Wazuh app - Agents controller
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import d3 from 'd3';
import $ from 'jquery';

const render = (dataset, element) => {
  try {
    var pie = d3.layout
      .pie()
      .value(function(d) {
        return d.value;
      })
      .sort(null)
      .padAngle(0.03);

    var w = 200,
      h = 200;

    var outerRadius = w / 2;
    var innerRadius = 75;

    var color = d3.scale.category10();

    var arc = d3.svg
      .arc()
      .outerRadius(outerRadius)
      .innerRadius(innerRadius);

    var svg = d3
      .select(`#${element}`)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', -w / 2 + ' ' + -h / 2 + ' ' + w + ' ' + h)
      .attr('preserveAspectRatio', 'xMinYMin')
      .append('g');
    var path = svg
      .selectAll('path')
      .data(pie(dataset))
      .enter()
      .append('path')
      .attr({
        d: arc,
        fill: function(d, i) {
          return color(d.data.name);
        }
      });

    path
      .transition()
      .duration(1000)
      .attrTween('d', function(d) {
        var interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function(t) {
          return arc(interpolate(t));
        };
      });

    var restOfTheData = function() {
      var text = svg
        .selectAll('text')
        .data(pie(dataset))
        .enter()
        .append('text')
        .transition()
        .duration(200)
        .attr('transform', function(d) {
          return 'translate(' + arc.centroid(d) + ')';
        })
        .attr('dy', '.4em')
        .attr('text-anchor', 'middle')
        .text(function(d) {
          return d.data.value;
        })
        .style({
          fill: '#fff',
          'font-size': '10px'
        });

      var legendRectSize = 20;
      var legendSpacing = 7;
      var legendHeight = legendRectSize + legendSpacing;

      var legend = svg
        .selectAll('.legend')
        .data(color.domain())
        .enter()
        .append('g')
        .attr({
          class: 'legend',
          transform: function(d, i) {
            //Just a calculation for x & y position
            return 'translate(-35,' + (i * legendHeight - 20) + ')';
          }
        });
      legend
        .append('rect')
        .attr({
          width: 12,
          height: 12,
          rx: 20,
          ry: 20
        })
        .style({
          fill: color,
          stroke: color
        });

      legend
        .append('text')
        .attr({
          x: 20,
          y: 10
        })
        .text(function(d) {
          return d;
        })
        .style({
          fill: '#929DAF',
          'font-size': '10px'
        });
    };

    restOfTheData();
  } catch (error) {
    console.log(error);
  }
};

const renderScaPie = (dataset, element) => {
  const checkExist = setInterval(function() {
    if ($(`#${element}`).length) {
      console.log(`#${element} is ready!`);
      clearInterval(checkExist);
      return render(dataset, element);
    }
  }, 100);
};

export default {
  renderScaPie
};
