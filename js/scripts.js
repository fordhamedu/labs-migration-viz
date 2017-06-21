var svg;
var currentData;
var lineChartData = {};

function highlightBars(highlightData) {
  var highlightCohort = highlightData.label;

  // add selected class to all bars with this label
  svg
    .selectAll('g')
    .selectAll('.bar')
    .classed('selected', function (d) {
      return d.label === highlightCohort;
    });

  // add selected class to all net circles with this label
  svg
    .selectAll('g')
    .selectAll('.net')
    .classed('selected', function (d) {
      return d.label === highlightCohort;
    });

  // add selected class to all bar labels with this label
  svg
    .selectAll('g')
    .selectAll('.bar-label')
    .classed('selected', function (d) {
      return d.label === highlightCohort;
    });

  // add selected class to all trendlines with this label
  svg
    .selectAll('.trendline')
    .classed('selected', function (d) {
      return d[0].label === highlightCohort;
    });

  // update cohort label
  $('#cohort-label').text('Age ' + highlightCohort);
}

function updateChart() {
  var clientRect = d3.select('body').node().getBoundingClientRect();

  var yMin = -400000;
  var yMax = 400000;

  // set the dimensions and margins of the graph
  var margin = { top: 20, right: 10, bottom: 20, left: 10 };
  var width = clientRect.width;
  var height = clientRect.height;

  // x scale to render each chart across the same axis
  var outerX = d3.scaleBand()
    .domain(Object.keys(currentData))
    .range([0, width])
    .padding(0.1);

  // local x scale
  var x = d3.scaleBand()
    .domain(currentData['1935_1940'].map(function (d) { return d.label; }))
    .range([0, width / 6])
    .padding(0.1);

  // local y scale
  var y = d3.scaleLinear()
    .domain([yMin, yMax])
    .range([height * 0.75, height * 0.25]);

  var line = d3.line()
    .x(function (d) { return outerX(d.year_range) + x(d.label) + margin.left + margin.right; })
    .y(function (d) { return y(d.net) + margin.top; })
    .curve(d3.curveCardinal);


  svg.attr('width', width)
    .attr('height', height);

  svg.selectAll('.in-label')
    .attr('x', 20)
    .attr('y', y(yMax) + margin.top - 10);

  svg.selectAll('.out-label')
    .attr('x', 20)
    .attr('y', y(yMin) + margin.top + 20);

  svg.selectAll('line')
    .attr('class', 'center-axis')
    .attr('x1', 0)
    .attr('y1', y(0) + margin.top)
    .attr('x2', width + margin.left + margin.right)
    .attr('y2', y(0) + margin.top)
    .attr('width', width);

  // add g elements for each chart, offset by outerX scale
  var g = svg.selectAll('g')
    .data(Object.keys(currentData));

  g.enter()
    .append('g')
    .attr('class', 'subbox')
    .merge(g)
    .attr('transform', function (d) {
      return 'translate(' + (outerX(d) + margin.left) + ',' + margin.top + ')';
    });

  // append the inflow rectangles
  var ins = svg.selectAll('g').selectAll('.in')
    .data(function (d) {
      return currentData[d];
    });

  ins.enter()
    .append('rect')
      .attr('class', function (d) { return 'bar in ' + d.label; })
      .on('mouseenter', highlightBars)
    .merge(ins)
      .attr('x', function (d) { return x(d.label); })
      .attr('width', x.bandwidth())
      .attr('y', function (d) { return y(d.in); })
      .attr('height', function (d) { return y(0) - y(d.in); });

  // append inflow labels

  var inLabels = svg.selectAll('g').selectAll('.bar-label.in')
    .data(function (d) {
      return currentData[d];
    });

  inLabels.enter()
    .append('text')
      .attr('class', function (d) { return 'bar-label in ' + d.label; })
      .attr('text-anchor', 'middle')
      .text(function (d) { return numeral(d.in).format('0.0a'); })
    .merge(inLabels)
      .attr('x', function (d) { return x(d.label) + (x.bandwidth() / 2); })
      .attr('y', function (d) { return y(d.in) - 5; });


  // append the outflow rectangles
  var outs = svg.selectAll('g').selectAll('.out')
    .data(function (d) { return currentData[d]; });

  outs.enter()
    .append('rect')
      .attr('class', 'bar out')
      .on('mouseenter', highlightBars)
    .merge(outs)
      .attr('x', function (d) { return x(d.label); })
      .attr('width', x.bandwidth())
      .attr('y', function () { return y(0); })
      .attr('height', function (d) { return y(0) - y(d.out); });

  // append outflow bar labels
  var outLabels = svg.selectAll('g').selectAll('.bar-label.out')
    .data(function (d) {
      return currentData[d];
    });

  outLabels.enter()
    .append('text')
      .attr('class', function (d) { return 'bar-label out ' + d.label; })
      .attr('text-anchor', 'middle')
      .text(function (d) { return numeral(d.out).format('0.0a'); })
    .merge(outLabels)
      .attr('x', function (d) { return x(d.label) + (x.bandwidth() / 2); })
      .attr('y', function (d) { return y(-d.out) + 15; });

  // append net bar labels

  var netLabels = svg.selectAll('g').selectAll('.bar-label.net')
    .data(function (d) {
      return currentData[d];
    });

  netLabels.enter()
    .append('text')
      .attr('class', function (d) { return 'bar-label net ' + d.label; })
      .attr('text-anchor', 'middle')
      .text(function (d) { return 'Δ ' + numeral(d.in - d.out).format('0.0a'); })
    .merge(netLabels)
      .attr('x', function (d) { return x(d.label) + (x.bandwidth() / 2); })
      .attr('y', function (d) { return y(-d.out) + 35; });

  // draw trendlines
  var trendlines = svg.selectAll('path')
    .data(Object.keys(lineChartData));

  trendlines.enter()
    .append('path')
    .attr('class', 'trendline')
    .merge(trendlines)
    .datum(function (d) {
      return lineChartData[d];
    })
    .attr('d', line);

  // append net migration dots
  var circles = svg.selectAll('g').selectAll('circle')
    .data(function (d) { return currentData[d]; });

  circles.enter()
    .append('circle')
      .attr('class', 'net')
    .merge(circles)
      .attr('cy', function (d) {
        var net = d.in - d.out;
        return y(net);
      })
      .attr('cx', function (d) { return x(d.label) + (x.bandwidth() / 2); })
      .attr('r', 3)
      .attr('fill', 'black');
}

function initializeChart() {
  // add main svg element
  svg = d3.select('.chart-container').append('svg');

  svg.append('line');

  svg.append('text')
    .attr('class', 'in-label in')
    .text('IN-MIGRATION');

  svg.append('text')
    .attr('class', 'out-label out')
    .text('OUT-MIGRATION');

  updateChart();
  highlightBars({ label: 'Under 10' }); // set initial highlight
}

// get the data
d3.json('data/age.json', function (error, data) {
  if (error) throw error;

  currentData = data;
  // prep data by cohort for line chart
  // get number of bands
  var numBands = currentData[Object.keys(currentData)[0]].length;

  for (var i = 0; i < numBands; i += 1) {
  // for (var i = 0; i < 1; i += 1) {
    var label = currentData[Object.keys(currentData)[0]][i].label;

    var points = [];
    Object.keys(currentData).forEach(function (key) { // eslint-disable-line
      var net = currentData[key][i].in - currentData[key][i].out;

      points.push({
        label: label,
        year_range: key,
        net: net
      });

      lineChartData[label] = points;
    });
  }

  initializeChart();
});

d3.csv('data/historic_migration_selchars.csv', function(data) {
  console.log(data);
});

window.addEventListener('resize', updateChart);
