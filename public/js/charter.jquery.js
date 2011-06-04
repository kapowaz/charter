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
            }
          });          
        }
        
        var redrawChart = function drawChart(chart){
          chart.graph.clear();
          
          // draw axes
          var xAxis = chart.graph.path('M100 440L620 440');
          var yAxis = chart.graph.path('M100 20L100 440');

          xAxis.attr({'stroke-width': 1});
          yAxis.attr({'stroke-width': 1});

          // draw tick marks for vertical scale
          var vmarkers = 6;
          for (var i = vmarkers; i > 0; i--) {
            var yPosition = (400 / vmarkers) * (vmarkers - i) + 20;
            var markerLine = chart.graph.path('M95 ' + yPosition + 'L620 ' + yPosition);
            markerLine.attr({'stroke-width': 0.5});

            var labelText = chart.yScale / vmarkers * i;
            var label = chart.graph.text(75, yPosition, labelText);
            label.attr({
              'font-family': 'Lucida Grande, Calibri, Tahoma, sans-serif',
              'font-size': '11px'
            });
          }

          // draw tick marks for horizontal scale
          var hmarkers = 5;
          for (var i = 0; i < hmarkers; i++) {
            var xPosition = (520 / (hmarkers - 1) * i) + 100;
            var markerLine = chart.graph.path('M' + xPosition + ' 440L' + xPosition + ' 450');
            markerLine.attr({'stroke-width': 0.5});

            if (i < chart.rows.length) {
              var labelText = chart.rows[i].label;
              var label = chart.graph.text(xPosition + 65, 460, labelText);
              label.attr({
                'font-family': 'Lucida Grande, Calibri, Tahoma, sans-serif',
                'font-size': '11px',
                'width': 130
              });
            }
          }

          // draw bars
          var i = 0;
          jQuery.each(chart.rows, function(key, row){
            jQuery.each(row.values, function(j, value){
              var series = chart.series[j];
              var height = (value / chart.yScale) * 420;
              var x = (i * 130) + (j * 60) + 110;
              var y = 420 - height + 20;
              var bar = chart.graph.rect(x, y, 50, height);

              bar.attr({
                'stroke-width': 0.5,
                'fill': colours[j]
              });
            });
            i++;
          });
        };
        
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
            
            $(input).bind('change blur', function(){
              chart.rows[$(this).closest('tr').attr('data-key')].values[i] = $(this).val();
              redrawChart(chart);
            });
          });
          
          chart.rows[$(this).attr('data-key')] = row;
        });
        
        // determine the maximum scale for the Y axis by finding out the largest value in the series, and rounding up to the nearest order of magnitude
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
        
        // console.dir(chart);
      }
    });
    
  };
  
  // sample usage:
  // $('table#foo').charter();
  
});