// extract and manipulate tabular JSON data from tables of fields
$(document).ready(function() {
  
  jQuery.fn.charter = function charter(){
    $(this).each(function(){
      var table = $(this);
      
      // has to be a table element
      // has to have a class of charter
      // mustn't have a data-charter-id attribute set
      
      if (this.nodeName == 'TABLE' && table.hasClass('charter') && !table.prop('data-charter-id'))
      {
        var chart = {
          uuid: Math.uuid(),
          series: [],
          rows: []
        };
        
        // event handler for whenever a series’ value is changed
        var seriesChangedHandler = function(e, seriesData){
          // e.g. seriesData => {series: 'Items', key: '5_inch_gloss', value: 1000}
          table.find('tbody tr[data-key=' + seriesData.key + '] td').each(function(i, element){
            if (i == chart.series.indexOf(seriesData.series)) {
              $(element).find('input[type=number]').val(seriesData.value);
            }
          });          
        }
        
        table.attr('data-charter-id', chart.uuid);
        
        // go through each row th in the thead to determine column headings
        table.find('thead tr th').each(function(){
          chart.series.push($(this).text());
        });
        
        // go through each row in the tbody to determine values
        table.find('tbody tr').each(function(){
          var row = {
            key: $(this).attr('data-key'),
            label: $(this).find('th[scope=row]').text(),
            values: []
          };
          
          $(this).find('td input[type=number]').each(function(){
            row.values.push($(this).val());
            $(this).bind('change', function(){
              // TODO: redraw chart
            });
          });
          
          chart.rows.push(row);
        });
        
        // TODO: generate a raphael SVG object to draw this chart in...

        // bind event handlers to this table
        table.bind('seriesChange.charter', seriesChangedHandler);
        
        // console.dir(chart);
      }
    });
    
  };
  
  // sample usage:
  // $('table#foo').charter();
  
});