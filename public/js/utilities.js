Number.prototype.ceilMagnitude = function(){
  if (this > 1) {
    var magnitude = Math.pow(10, (this.toString().length - 1));
    return Math.ceil(this / magnitude) * magnitude;
  } else {
    return 1;
  }
};

var objectLength = function objectLength(object) {
  var size = 0, key;
  for (key in object) {
    if (object.hasOwnProperty(key)) size++;
  }
  return size;
};