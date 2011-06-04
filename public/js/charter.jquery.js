// extract and manipulate tabular JSON data from tables of fields
$(document).ready(function() {
  
  jQuery.fn.charter = function charter(){
    $(this).each(function(){
      var table = $(this);
      var colours = {
        0: '#f66c1d',
        1: '#7d007f'
      };
      
      // has to be a table element
      // has to have a class of charter
      // mustn't have a data-charter-id attribute set
      
      if (this.nodeName == 'TABLE' && table.hasClass('charter') && !table.prop('data-charter-id'))
      {
        var chart = {
          uuid: Math.uuid(),
          series: [],
          rows: {},
          graph: null,
          yScale: null
        };
        
        // event handler for whenever a series’ value is changed
        var seriesChangedHandler = function seriesChangedHandler(e, seriesData){
          // e.g. seriesData => {series: 'Items', key: '5_inch_gloss', value: 1000}
          table.find('tbody tr[data-key=' + seriesData.key + '] td').each(function(i, element){
            if (i == chart.series.indexOf(seriesData.series)) {
              $(element).find('input[type=number]').val(seriesData.value);
              chart.rows[seriesData.key][chart.series.indexOf(seriesData.series)] = seriesData.value;
            }
          });
        }; // seriesChangedHandler();
        
        var redrawChart = function drawChart(chart){
          chart.graph.clear();
          
          // draw axes
          var xAxis = chart.graph.path('M100 440L620 440');
          var yAxis = chart.graph.path('M100 20L100 440');

          xAxis.attr({'stroke-width': 1});
          yAxis.attr({'stroke-width': 1});

          // draw tick marks for vertical scale
          var vmarkers = 6;
          for (var count = vmarkers; count > 0; count--) {
            var yPosition = (420 / vmarkers) * (vmarkers - count) + 20;
            chart.graph.path('M90 ' + yPosition + 'L620 ' + yPosition).attr({'stroke-width': 0.5});

            var labelText = Math.round(chart.yScale / vmarkers * count);
            chart.graph.text(80, yPosition, labelText).attr({
              'font-family': 'Lucida Grande, Calibri, Tahoma, sans-serif',
              'font-size': '11px',
              'text-anchor': 'end'
            });
          }
          chart.graph.path('M90 440L100 440').attr({'stroke-width': 0.5});
          chart.graph.text(80, 440, 0).attr({
            'font-family': 'Lucida Grande, Calibri, Tahoma, sans-serif',
            'font-size': '11px',
            'text-anchor': 'end'
          });
          

          // draw bars and tick marks for horizontal scale
          var hmarkers = 5;
          var i = 0;
          jQuery.each(chart.rows, function(key, row){
            
            var xPosition = (520 / (hmarkers - 1) * i) + 100;
            chart.graph.path('M' + xPosition + ' 440L' + xPosition + ' 450').attr({'stroke-width': 0.5});
            label = chart.graph.text(xPosition + 65, 460, row.label).attr({
              'font-family': 'Lucida Grande, Calibri, Tahoma, sans-serif',
              'font-size': '11px',
              'width': 130
            });
            
            jQuery.each(row.values, function(j, value){
              
              // draw each bar
              var series = chart.series[j];
              var height = value / chart.yScale * 420;
              var xPosition = (i * 130) + (j * 60) + 110;
              var yPosition = 440 - height;
              var bar = chart.graph.rect(xPosition, yPosition, 50, height).attr({
                'stroke-width': 0.5,
                'fill': colours[j]
              });
              
              var startingY = 0;
              var startingHeight = 0;
              
              var drag = function(dx, dy){
                var newYPosition = Math.round(startingY + dy);
                var newHeight = Math.round(startingHeight + (-1 * dy));
                
                if (newYPosition > 440) {
                  newYPosition = 440;
                  newHeight = 0;
                }
                if (newYPosition < 20) {
                  newYPosition = 20;
                  newHeight = 420;
                }
                
                bar.attr({y: newYPosition, height: newHeight});
                handle.attr({y: newYPosition});
                
                var seriesChange = {
                  series: chart.series[j],
                  key: key,
                  value: Math.round((bar.attr('height') / 420) * chart.yScale)
                };
                
                // set new value by raising event.
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
                            
              // draw an invisible drag handle above each bar
              var handle = chart.graph.rect(xPosition, yPosition, 50, 5).attr({
                'cursor': 'move',
                'stroke-width': 0,
                'fill': 'rgba(0,0,0,0)'
              }).drag(drag, dragStart, dragEnd);
              
            });
            i++;
          });
          chart.graph.path('M620 440L620 450').attr({'stroke-width': 0.5});
          
          // draw series key container frame
          var keyContainerHeight = (chart.series.length * 30) + 10;
          var keyContainerYPos = 230 - (keyContainerHeight / 2);
          
          chart.graph.rect(630, keyContainerYPos, 80, keyContainerHeight);
          
          // draw series key
          jQuery.each(chart.series, function(i, name){
            chart.graph.rect(640, (30 * i) + keyContainerYPos + 10, 20, 20).attr({
              'stroke-width': 0.5,
              'fill': colours[i]
            });
            chart.graph.text(665, (30 * i) + keyContainerYPos + 20, name).attr({
              'font-family': 'Lucida Grande, Calibri, Tahoma, sans-serif',
              'font-size': '11px',
              'width': 80,
              'text-anchor': 'start'
            });
          });
          
        }; // redrawChart();
        
        table.attr('data-charter-id', chart.uuid);
        
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
            
            $(input).bind('change blur click', function(){
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
        
        // create a container for the Raphael canvas...
        var graphContainer = $('<div class="graph"></div>');
        graphContainer.attr('data-charter-id', chart.uuid);
        table.after(graphContainer);
        chart.graph = Raphael(graphContainer[0], 720, 480);
        redrawChart(chart);

        // bind event handlers to this table
        table.bind('seriesChange.charter', seriesChangedHandler);
      }
    });
    
  };
  
  // sample usage:
  // $('table#foo').charter();
  
});