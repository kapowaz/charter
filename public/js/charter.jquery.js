// extract and manipulate tabular JSON data from tables of fields
$(document).ready(function() {
  
  jQuery.fn.charter = function charter(){
    $(this).each(function(){
      var table = $(this);
      
      var metrics = {
        width: 720,
        height: 480,
        padding: {
          top: 20,
          right: 100,
          bottom: 40,
          left: 100
        },
        ticks: {
          vertical: 6,
          length: 10
        },
        gap: 10,
        seriesKeySize: 20,
        seriesKeyGap: 10,
        seriesKeyLabelGap: 5,
        seriesColours: ['#c60035', '#00b24f', '#df6a00', '#0021b2', '#dfc300', '#b000b2', '#55c000', '#df2200', '#006fb2', '#df9600', '#4000b2', '#c6d600']
      };
      
      // define a few style objects that'll be used in a few places
      var defaultTextStyle = {
        'font-family': 'Lucida Grande, Calibri, Tahoma, sans-serif',
        'font-size': '11px'
      };
      var verticalLabelStyle = jQuery.extend({'text-anchor': 'end'}, defaultTextStyle);
      var strokeTickMarks = {'stroke-width': 0.5};
      var strokeAxes = {'stroke-width': 1};
      
      // has to be a table element with a class of charter
      if (this.nodeName == 'TABLE' && table.hasClass('charter'))
      {
        var chart = {
          series: [],
          rows: {},
          graph: null,
          yScale: null
        };
        
        // event handler for whenever a series’ value is changed
        var seriesChangedHandler = function seriesChangedHandler(e, seriesData){
          // seriesData => {series: 'Items', key: '5_inch_gloss', value: 1000}
          table.find('tbody tr[data-key=' + seriesData.key + '] td').each(function(i, element){
            if (i == chart.series.indexOf(seriesData.series)) {
              $(element).find('input[type=number]').val(seriesData.value);
              chart.rows[seriesData.key].values[chart.series.indexOf(seriesData.series)] = seriesData.value;
            }
          });
        }; // seriesChangedHandler();
        
        var redrawChart = function drawChart(chart){
          chart.graph.clear();
          
          // draw axes
          var xAxis = 'M' + metrics.padding.left + ' ' + (metrics.height - metrics.padding.bottom) + 'L' + (metrics.width - metrics.padding.right) + ' ' + (metrics.height - metrics.padding.bottom);
          var yAxis = 'M' + metrics.padding.left + ' ' + metrics.padding.top + 'L' + metrics.padding.left + ' ' + (metrics.height - metrics.padding.bottom);
          
          chart.graph.path(xAxis).attr(strokeAxes);
          chart.graph.path(yAxis).attr(strokeAxes);

          // draw tick marks for vertical scale
          for (var count = metrics.ticks.vertical; count > 0; count--) {
            var yPosition = ((metrics.height - (metrics.padding.top + metrics.padding.bottom)) / metrics.ticks.vertical) * (metrics.ticks.vertical - count) + metrics.padding.top;
            chart.graph.path('M' + (metrics.padding.left - metrics.ticks.length) + ' ' + yPosition + 'L' + (metrics.width - metrics.padding.right) + ' ' + yPosition).attr(strokeTickMarks);
            var labelText = Math.round(chart.yScale / metrics.ticks.vertical * count);
            chart.graph.text(metrics.padding.left - (metrics.ticks.length * 2), yPosition, labelText).attr(verticalLabelStyle);
          }
          
          // final vertical tick mark
          var finalTick = 'M' + (metrics.padding.left - metrics.ticks.length) + ' ' + (metrics.height - metrics.padding.bottom) + 'L' + metrics.padding.left + ' ' + (metrics.height - metrics.padding.bottom);
          chart.graph.path(finalTick).attr(strokeTickMarks);
          chart.graph.text(metrics.padding.left - (metrics.ticks.length * 2), (metrics.height - metrics.padding.bottom), 0).attr(verticalLabelStyle);

          // draw bars and tick marks for horizontal scale
          var i = 0;
          var sectionWidth = (metrics.width - (metrics.padding.left + metrics.padding.right)) / objectLength(chart.rows);
          
          jQuery.each(chart.rows, function(key, row){
            var xPosition = ((metrics.width - (metrics.padding.left + metrics.padding.right)) / objectLength(chart.rows) * i) + metrics.padding.left;
            chart.graph.path('M' + xPosition + ' ' + (metrics.height - metrics.padding.bottom) + 'L' + xPosition + ' ' + (metrics.height - metrics.padding.bottom + metrics.ticks.length)).attr(strokeTickMarks);
            label = chart.graph.text(xPosition + (sectionWidth / 2), (metrics.height - metrics.padding.bottom + (metrics.ticks.length * 2)), row.label).attr(jQuery.extend({'width': sectionWidth}, defaultTextStyle));
            
            jQuery.each(row.values, function(j, value){
              // draw each bar
              var series = chart.series[j];
              var barHeight = value / chart.yScale * (metrics.height - (metrics.padding.top + metrics.padding.bottom));
              var barWidth = (sectionWidth - ((chart.series.length + 1) * metrics.gap)) / chart.series.length;
              var xPosition = (i * sectionWidth) + (j * (barWidth + metrics.gap)) + metrics.padding.left + metrics.gap;
              var yPosition = (metrics.height - metrics.padding.bottom) - barHeight;
              
              var bar = chart.graph.rect(xPosition, yPosition, barWidth, barHeight).attr({
                'stroke-width': 0.5,
                'fill': metrics.seriesColours[j]
              });
              
              var startingY = 0;
              var startingHeight = 0;
              
              var drag = function(dx, dy){
                var newYPosition = Math.round(startingY + dy);
                var newHeight = Math.round(startingHeight + (-1 * dy));
                
                if (newYPosition > metrics.height - metrics.padding.bottom) {
                  newYPosition = metrics.height - metrics.padding.bottom;
                  newHeight = 0;
                } else if (newYPosition < metrics.padding.top) {
                  newYPosition = metrics.padding.top;
                  newHeight = metrics.height - (metrics.padding.top + metrics.padding.bottom);
                }
                
                bar.attr({y: newYPosition, height: newHeight});
                handle.attr({y: newYPosition});
                
                var seriesChange = {
                  series: chart.series[j],
                  key: key,
                  value: Math.round((bar.attr('height') / (metrics.height - (metrics.padding.top + metrics.padding.bottom))) * chart.yScale)
                };
                
                // trigger custom event that the series’ value has changed
                table.trigger('seriesChange.charter', seriesChange);
              };
              
              var dragStart = function(){
                startingY = parseInt(bar.attr('y'),10);
                startingHeight = parseInt(bar.attr('height'),10);
              };
              var dragEnd = function(){
                startingY = 0;
                startingHeight = 0;
              };
                            
              // draw an invisible drag handle above each bar, with drag event handlers
              var handle = chart.graph.rect(xPosition, yPosition, barWidth, 5).attr({
                'cursor': 'move',
                'stroke-width': 0,
                'fill': 'rgba(0,0,0,0)'
              }).drag(drag, dragStart, dragEnd);
              
            });
            i++;
          });
          
          // final horizontal tickmark
          finalTick = 'M' + (metrics.width - metrics.padding.right) + ' ' + (metrics.height - metrics.padding.bottom) + 
                      'L' + (metrics.width - metrics.padding.right) + ' ' + ((metrics.height - metrics.padding.bottom) + metrics.ticks.length);
          chart.graph.path(finalTick).attr(strokeTickMarks);
          
          // draw series key
          var seriesKeyWidth = metrics.padding.right - (metrics.seriesKeyGap * 2);
          var seriesKeyHeight = (chart.series.length * (metrics.seriesKeySize + metrics.seriesKeyGap)) + metrics.seriesKeyGap;
          var seriesKeyXPosition = metrics.width - metrics.padding.right + metrics.seriesKeyGap;
          var seriesKeyYPosition = ((metrics.height - (metrics.padding.top + metrics.padding.bottom))/2) - (seriesKeyHeight / 2) + metrics.padding.top;
          chart.graph.rect(seriesKeyXPosition, seriesKeyYPosition, seriesKeyWidth, seriesKeyHeight);
          
          // draw series key
          jQuery.each(chart.series, function(i, name){
            chart.graph.rect(
              (metrics.width - metrics.padding.right) + (metrics.seriesKeyGap * 2), 
              ((metrics.seriesKeySize + metrics.seriesKeyGap) * i) + seriesKeyYPosition + metrics.seriesKeyGap, 
              metrics.seriesKeySize, metrics.seriesKeySize).attr({
              'stroke-width': 0.5,
              'fill': metrics.seriesColours[i]
            });
            
            chart.graph.text(
              (metrics.width - metrics.padding.right) + (metrics.seriesKeyGap * 2) + metrics.seriesKeySize + metrics.seriesKeyLabelGap, 
              ((metrics.seriesKeySize + metrics.seriesKeyGap) * i) + seriesKeyYPosition + metrics.seriesKeyGap + (metrics.seriesKeySize / 2),
              name).attr(jQuery.extend({'text-anchor': 'start'}, defaultTextStyle));
          });
          
        }; // redrawChart();
        
        
        // go through each row th in the thead to determine column headings
        table.find('thead tr th').each(function(){
          chart.series.push($(this).text());
        });
        
        // go through each row in the tbody to determine values
        table.find('tbody tr').each(function(){
          var row = {
            label: $(this).find('th[scope=row]').text(),
            values: []
          };
          
          $(this).find('td input[type=number]').each(function(i, input){
            row.values.push(parseInt($(this).val(),10));

            $(input).bind('focus', function(){
              $(this).closest('td').addClass('focus');
            });
            
            $(input).bind('blur', function(){
              $(this).closest('td').removeClass('focus');
            });
            
            $(input).bind('change blur click keyup', function(){
              // prevent manual entry of out-of-range values
              if ($(this).val() > 6000) {
                $(this).val(6000);
              } else if ($(this).val() < 0) {
                $(this).val(0);
              } else if (isNaN($(this).val())) {
                $(this).val(chart.rows[$(this).closest('tr').attr('data-key')].values[i]);
              }              
              chart.rows[$(this).closest('tr').attr('data-key')].values[i] = $(this).val();
              redrawChart(chart);
            });
            
          });
          
          chart.rows[$(this).attr('data-key')] = row;
        });
        
        // determine the maximum scale for the Y axis by finding out the largest 
        // value in the series, and rounding up to the nearest order of magnitude
        var largest = 0;        
        jQuery.each(chart.rows, function(key, row){
          jQuery.each(row.values, function(j, value){
            if (value > largest) largest = value;
          });
        });
        chart.yScale = largest.ceilMagnitude();
        
        // create a container for the Raphael SVG canvas...
        var graphContainer = $('<div class="graph"></div>');
        table.after(graphContainer);
        chart.graph = Raphael(graphContainer[0], metrics.width, metrics.height);
        redrawChart(chart);

        // bind event handlers to this table
        table.bind('seriesChange.charter', seriesChangedHandler);
      }
    });
    
  };
  
  // usage:
  // $('table#foo').charter();
  
});