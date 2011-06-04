$(document).ready(function() {

  // browser engine-specific flags
  if ($.browser.mozilla) $('body').addClass('mozilla');
  if ($.browser.webkit) $('body').addClass('webkit');
  if ($.browser.ie) $('body').addClass('ie');
  
  $('table#product_orders').charter();
  
  // to test event triggering/binding
  $('a.testlink').click(function(e){
    e.preventDefault();
    $('table#product_orders').trigger('seriesChange.charter', {series: 'Items', key: '5_inch_gloss', value: 1000});
  });
  
});