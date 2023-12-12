// Continuous color scale using HSL color naming. Ref: https://www.w3schools.com/colors/colors_hsl.asp

const 
  hMargin = 70,       	// Horizontal margin - Compare with "width" and "container".
  vMargin = 40,       	// Vertical margin - compare with "height" and "container".
  paletteMargin = 25, 	// horizontal margin of the color palette inside the legend
  cellWidth = 4,      	// Width of each individual cell.
  cellHeight = 40,    	// Height of each individual cell.
  tipHeight = 50,     	// Tooltip box size.
  xLabel = "Year",    	// Horizontal Axis label.
  yLabel = "Month",   	// Vertical Axis label.
	hueRange = [240, 0],	// left & right values for color Hue (HSL colors: 0=Red, 120=Green, 240=Blue).
	paletteHeight = 20,   // Height of the color palette.
  paletteWidth = 250,   // Width of the color palette. 
  contWidth = 1200,   	//Container - Compare with .js file
  contHeight = 750,   	//Container - Compare with .js file
  legendWidth = 290,   	//legend (palette) - Compare with paletteWidth in .js file
  legendHeight = paletteHeight + 2*paletteMargin,    //legend (palette) - Compare with paletteHeight in .js file
  legendLabel = "Temperature color code";

// =====================
// File with source data
// =====================
const dataFile = 'https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json'; // Option for web file.
// const dataFile = 'data.json'; // Option for local file.

// =====================
// Function to get month long name from month number (-1)
// =====================
function getMonth(num) {
  let date = new Date();    // Create a new variable of type "date".
  date.setMonth(num);       // Assign the month entered as parameter.
  return date.toLocaleString('en-US', { month: 'long' });   // Return the month in long format.
}

// =====================
// Create function to assign scaled HSL color
// =====================
function colorHSL(value, domain, range) {
  const hue = range[0] + (value - domain[0]) * (range[1] - range[0]) / (domain[1] - domain[0]);
  return 'hsl(' + hue + ', 100%, 50%)';
}

// =====================
// Create color palette using SVG element
// =====================
let	colors = [];	// Array to store the colors of the palete (1 element per pixel):			

const	container = d3.select('#container')
		.style('width', contWidth + 'px')
		.style('height', contHeight + 'px');
	legend = d3.select('#legend')	
		.style('width', legendWidth + 'px')
		.style('height', legendHeight + 'px');

const palette = d3.select('#palette')
  .attr('width', paletteWidth + 2*paletteMargin);

for (i = 0; i <= paletteWidth; i++) { 
	colors.push(colorHSL(i, [0, paletteWidth], hueRange));
}

palette
  .selectAll('rect')
  .data(colors)
  .enter()
  .append('rect')
  .attr('x', (d, i) => paletteMargin + i)
  .attr('width', 1)
  .attr('height', paletteHeight)
  .style('fill', (d) => d);

// =====================
// Assign name to the Tooltip
// =====================    
const tip = d3.select('#tooltip');

// =====================
// Retrieve data from file ==> dynamic code.
// =====================
fetch(dataFile)                    // Retrieve the remote file.
  .then(file => file.json())       // Create a JSON object with the response.
  .then(json => {
    const baseTemp = json.baseTemperature;  // Variable to store base temperature.  
    const data = json.monthlyVariance;      // Array to store historic data.
    data.forEach(d => {
      d.month -= 1;                         // Change months [1. 12] to [0, 11] !!!
      d.temp = baseTemp + d.variance;       // Add property 'temp'.
    });

    // =====================
    // Create text in "description" from the json file.
    // =====================
    d3.select('#description')
      .html( data[0].year + ' - ' + data[data.length - 1].year + ': base temperature ' + baseTemp +  '&#8451;' );   

    // =====================
    // SVG Chart: dynamic dimensions and position.
    // =====================
    const                        
      svgWidth = hMargin + cellWidth * data.length / 12,
      svgHeight = vMargin + cellHeight * 12;

    const chart = d3.select('#chart')  // Assign name and dimensions to SVG chart.
      .attr('width', svgWidth)
      .attr('height', svgHeight);

    chart.append('text')        // Add X-axis label (dynamic position).
      .text(xLabel)
      .attr('class', 'Label')
      .attr('id', 'x-Label')
      .attr('x', svgWidth / 2) 
      .attr('y', svgHeight);
  
    chart.append('text')        // Add Y-axis label (dynamic position).
      .attr('transform', 'rotate(-90)')
      .text(yLabel)
      .attr('class', 'Label')
      .attr('id', 'y-Label')
      .attr('x', -svgHeight / 2 )
      .attr('y', hMargin / 3);

    // =====================
    // --- X Axis
    // =====================  
    // Define domain/range/scaling for X-axis
    const                 
      yearExtent = d3.extent(data.map(d => d.year)),        //-> [1753,2015]
      xDomain = d3.range(yearExtent[0], yearExtent[1] + 1), // Domain of Values for band scale [1753, 1754, 1755 .... 2015]
      xTicks = xDomain.filter(i => i % 10 == 0),            // Filtered ticks to display [1760, 1770, 1780 .... 2010]
      xRange  = [0, svgWidth - hMargin],                    // Range of coordinates.
      xScale = d3.scaleBand(xDomain, xRange),               // Scale values <-> coordinates.
      x_axis = d3.axisBottom(xScale).tickValues(xTicks);    // X-axis definition.

    chart.append('g')     // Create X-axis
      .call(x_axis)
      .attr('id', 'x-axis')
      .attr('transform', 'translate(' + hMargin + ',' + (svgHeight - vMargin) + ')')
      .selectAll('text');

    // =====================
    // --- Y Axis
    // =====================  
    // Define domain/range/scaling for Y-axis
    const                 
      monthExtent = d3.extent(data.map(d => d.month)),          //-> [0,11]
      monthRange = d3.range(monthExtent[0], monthExtent[1]+1),  //-> [0,1,2,3,4,5,6,7,8,9,10,11]
      yDomain = monthRange.map(d => getMonth(d)),   // Domain of Values for band scale ["January","February"...,"December"]
      yRange = [svgHeight - vMargin, 0],            // Range of coordinates.
      yScale = d3.scaleBand(yDomain, yRange),       // Scale values <-> coordinates.
      y_axis = d3.axisLeft(yScale);                 // Y-axis definition.
 
    chart.append('g')     // Create X-axis
      .call(y_axis)
      .attr('id', 'y-axis')
      .attr('transform', 'translate(' + hMargin + ', 0 )')
      .selectAll('text');

    // =====================
    // --- Z Axis (temperature <=> color)
    // =====================    
    // Define color scale applied to temperature range    
    const               
      zMin = Math.floor(Math.min(...data.map(d => d.temp))),
      zMax = Math.ceil(Math.max(...data.map(d=> d.temp))),
      zDomain = [zMin, zMax],                     // Domain values for linear scale [1, 14]
      zRange  = [0, paletteWidth],  							// Range of coordinates.
      zScale = d3.scaleLinear(zDomain, zRange),   // Scale values <-> coordinates.
      z_axis = d3.axisBottom(zScale);                    // Z-axis definition.

    // Assign color from palette to each element in data array
    data.forEach( (item) => { item.color = colorHSL(item.temp, zDomain, hueRange); });
    palette.append('g')       // Create Z-axis
      .call(z_axis)
      .attr('id', 'z-axis')  
      .attr('transform', 'translate(' + paletteMargin + ', ' + paletteHeight + ')');
  
    // =====================
    // Create cells as rect elements.
    // =====================      
    chart
      .selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'cell')
      .attr('x', (d, i) => hMargin + (d.year - 1753) * cellWidth)
      .attr('y', (d, i) => svgHeight - vMargin - (d.month + 1) * cellHeight)
      .attr('data-month', d => d.month)
      .attr('data-year', d => d.year)
      .attr('data-temp', d => d.temp)
      .attr('width', cellWidth)
      .attr('height', cellHeight)
      .style('fill', (d) => d.color)
	
      // =============================================================
      // Show/hide tooltip
      // =============================================================          
      .on('mouseover', function (event, d) { 
        tip.attr('data-year', d.year);
        tip
          .style('opacity', 0.8)
          .html(getMonth(d.month) + ', ' + d.year + ':<br />' + 
                'Temp: ' + d3.format('.2f')(d.temp) + '&degC / var = ' 
                + d3.format('.2f')(d.variance) + '&degC'  )
          .style('left', event.pageX + 'px')
          .style('top', event.pageY - 40  + 'px');
      })
      .on('mouseout', function () { tip.style('opacity', 0);  }
      );
});

