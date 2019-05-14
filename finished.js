'use strict';

(function() {

  let data = "no data";
  let allYearsData = "no data";
  let svgLineGraph = "";
  let svgTooltip = ""; // keep SVG reference in global scope
  let selectedCountry = ""; // keep selected year svg in global scope
  let mapFunctions = ""; // keep map functions in global scope for easy reference
  let tooltipDiv = "";

  // load data and make scatter plot after window loads
  window.onload = function() {
    svgLineGraph = d3.select('body')
      .append('svg')
      .attr('width', 1000)
      .attr('height', 800);

    // d3.csv is basically fetch but it can be be passed a csv file as a parameter
    d3.csv("./dataEveryYear.csv")
      .then((csvData) => {
        data = csvData;
        allYearsData = csvData;

        // Create an object to hold all of the unique countries
        let unique_countries = [];

        // Loop through and get the unique values for the year
        data.forEach(row => {
          let country = (row["location"])
          if (unique_countries.indexOf(country) == -1) {
            unique_countries.push(country)
          }
        });

        // Sort so that the dropdown is alphabetical
        unique_countries.sort()
        selectedCountry = unique_countries[0];

        // Add the dropdown menu
        addDropdown(unique_countries);
        makeLineGraph();

        tooltipDiv = d3.select("body").append("div")
          .attr("class", "tooltip")
          .style("opacity", 0)

        svgTooltip = tooltipDiv.append('svg')
          .attr('width', 300)
          .attr('height', 300);

        makeScatterPlot();
      });
  }

  // Adds the dropdown menu with the years onto the svg
  function addDropdown(country_data) {

    // Append the dropdown to the SVG
    let dropdown = d3.select('select')

    // Append the options to the dropdown
    let options = dropdown
      .selectAll('option')
      .data(country_data).enter()
      .append('option')
        .text(d => d)
        
    // Remove current points and redraw the scatter plot
    dropdown.on('change', function(){
      selectedCountry = d3.select('select').property('value');
      makeLineGraph();
    });

  }

  // Make line graph based on the chosen country
  function makeLineGraph() {

    // Clear out the current html in the line graph svg
    svgLineGraph.html("");

    // Filter data based on selected country
    let countryData = allYearsData.filter((row) => row["location"] == selectedCountry);

    // Get all the years for the given country
    let timeData = countryData.map((row) => row["time"]);

    // Get the population data for the given country
    let populationData = countryData.map((row) => row["pop_mlns"]);

    let minMax = findMinMax(timeData, populationData)

    let funcs = drawAxes(minMax, "time", "pop_mlns", svgLineGraph, {min: 100, max: 950}, {min: 100, max: 750});
    plotLineGraph(funcs, countryData, selectedCountry)
  }

  function plotLineGraph(funcs, countryData, country) {

  //   // Append the tooltip
  //   let tooltipDiv = d3.select("body").append("div")
  //   .attr("class", "tooltip")
  //   .style("opacity", 0)

  // svgTooltip = tooltipDiv.append('svg')
  //   .attr('width', 300)
  //   .attr('height', 300);
    
    let line = d3.line()
      .x((d) => funcs.x(d))
      .y((d) => funcs.y(d));

    svgLineGraph.append('path')
      .datum(countryData)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("stroke-width", 4)
      .attr("d", line)
      // Add the tooltip functionality
      .on("mouseover", (d) => {

        tooltipDiv.transition()
          .duration(200)
          .style("opacity", 1)
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 28) + "px");

      })
      .on("mouseout", (d) => {
        tooltipDiv.transition()
          .duration(500)
          .style("opacity", 0);
      });
      ;

    svgLineGraph.append('text')
      .attr('x', 500)
      .attr('y', 800)
      .style('font-size', '15pt')
      .text('Year');

    svgLineGraph.append('text')
      .attr('x', 550)
      .attr('y', 50)
      .style('font-size', '20pt')
      .text(country);

    svgLineGraph.append('text')
      .attr('transform', 'translate(50, 475)rotate(-90)')
      .style('font-size', '15pt')
      .text('Population (in millions)');

  }

  // draw the axes and ticks
  function drawAxes(limits, x, y, svg, rangeX, rangeY) {
    // return x value from a row of data
    let xValue = function(d) { return +d[x]; }

    // function to scale x value
    let xScale = d3.scaleLinear()
      .domain([limits.xMin, limits.xMax]) // give domain buffer room
      .range([rangeX.min, rangeX.max]);

    // xMap returns a scaled x value from a row of data
    let xMap = function(d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale);
    svg.append("g")
      .attr('transform', 'translate(0, ' + rangeY.max + ')')
      .call(xAxis);

    // return y value from a row of data
    let yValue = function(d) { return +d[y]}

    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([limits.yMax, limits.yMin]) // give domain buffer
      .range([rangeY.min, rangeY.max]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svg.append('g')
      .attr('transform', 'translate(' + rangeX.min + ', 0)')
      .call(yAxis);

    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }

  // find min and max for arrays of x and y
  function findMinMax(x, y) {

    // get min/max x values
    let xMin = d3.min(x);
    let xMax = d3.max(x);

    // get min/max y values
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    // return formatted min/max data as an object
    return {
      xMin : xMin,
      xMax : xMax,
      yMin : yMin,
      yMax : yMax
    }
  }

  function makeScatterPlot() {
    // get arrays of fertility rate data and life Expectancy data
    let fertility_rate_data = data.map((row) => parseFloat(row["fertility_rate"]));
    let life_expectancy_data = data.map((row) => parseFloat(row["life_expectancy"]));

    // find data limits
    let axesLimits = findMinMax(fertility_rate_data, life_expectancy_data);

     // draw axes and return scaling + mapping functions
     let mapFunctions = drawAxes(axesLimits, "fertility_rate", "life_expectancy", svgTooltip, {min: 50, max: 250}, {min: 50, max: 250});

     // plot data as points and add tooltip functionality
     plotData(mapFunctions);

  }

  function plotData(map) {

    // get population data as array
    let pop_data = data.map((row) => +row["pop_mlns"]);
    let pop_limits = d3.extent(pop_data);

    // make size scaling function for population
    let pop_map_func = d3.scaleLinear()
      .domain([pop_limits[0], pop_limits[1]])
      .range([3, 20]);

    // mapping functions
    let xMap = map.x;
    let yMap = map.y;


    // append data to SVG and plot as points
    svgTooltip.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
        .attr('cx', xMap)
        .attr('cy', yMap)
        .attr('r', (d) => 1)
        .style('opacity', 0.6)
        .attr('fill', "#4286f4");

    // draw title and axes labels
    makeLabels();
  }

  // make title and axes labels
  function makeLabels() {

    svgTooltip.append('text')
      .attr('x', 50)
      .attr('y', 30)
      .style('font-size', '8pt')
      .text("Life Expectancy vs. Fertility Rate for all countries");

    svgTooltip.append('text')
      .attr('x', 50)
      .attr('y', 285)
      .style('font-size', '8pt')
      .text('Fertility Rates (Avg Children per Woman)');

    svgTooltip.append('text')
      .attr('transform', 'translate(15, 200)rotate(-90)')
      .style('font-size', '8pt')
      .text('Life Expectancy (years)');
  }


  // format numbers
  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
})();
