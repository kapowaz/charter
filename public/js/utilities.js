Number.prototype.ceilMagnitude = function(){
  if (this > 1) {
    var magnitude = Math.pow(10, (this.toString().length - 1));
    return Math.ceil(this / magnitude) * magnitude;
  } else {
    return 1;
  }
};