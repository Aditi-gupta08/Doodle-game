'use strict';

(function() {

const canvas = document.querySelector('#canvas');
const context = canvas.getContext('2d');
var colors = document.getElementsByClassName('colors');
var clear = document.getElementsByClassName('clear');
var eraser = document.getElementsByClassName('eraser');

var current = {
    color: 'green',
    line_width: 3
  };

  var drawing = false;

  canvas.addEventListener('mousedown', onMouseDown, false);
  canvas.addEventListener('mouseup', onMouseUp, false);
  canvas.addEventListener('mouseout', onMouseUp, false);
  canvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);
  
  //Touch support for mobile devices
  canvas.addEventListener('touchstart', onMouseDown, false);
  canvas.addEventListener('touchend', onMouseUp, false);
  canvas.addEventListener('touchcancel', onMouseUp, false);
  canvas.addEventListener('touchmove', throttle(onMouseMove, 10), false);

  for (let i = 0; i < colors.length; i++){
    colors[i].addEventListener('click', onColorUpdate, false);
  }

  for (let i = 0; i < clear.length; i++){
    clear[i].addEventListener('click', clearAll, false);
  }

  for (let i = 0; i < eraser.length; i++){
    eraser[i].addEventListener('click', eraseDrawing, false);
  }

  


  socket.on('drawing', onDrawingEvent);

  window.addEventListener('resize', onResize, false);
  onResize();


  function drawLine(x0, y0, x1, y1, color, line_width, emit){
    context.beginPath();
    context.moveTo(x0 , y0 );
    context.lineTo(x1 - canvas.offsetLeft, y1- canvas.offsetTop);
    context.strokeStyle = color;
    context.lineWidth = line_width;
    context.stroke();
    context.closePath();

    if (!emit) { return; }
    var w = canvas.width ;
    var h = canvas.height;

    socket.emit('drawing', {
      x0: x0 / w,
      y0: y0 / h,
      x1: x1 / w,
      y1: y1 / h,
      color: color,
      line_width: line_width
    });
  }

  function onMouseDown(e){
    drawing = true;
    current.x = e.clientX - canvas.offsetLeft||e.touches[0].clientX;
    current.y = e.clientY - canvas.offsetTop ||e.touches[0].clientY;
  }

  function onMouseUp(e){
    if (!drawing) { return; }
    drawing = false;
    drawLine(current.x, current.y, e.clientX  ||e.touches[0].clientX, e.clientY ||e.touches[0].clientY, current.color, current.line_width, true);
  }

  function onMouseMove(e){
    if (!drawing) { return; }
    drawLine(current.x, current.y, e.clientX||e.touches[0].clientX, e.clientY||e.touches[0].clientY, current.color, current.line_width, true);
    current.x = e.clientX - canvas.offsetLeft||e.touches[0].clientX;
    current.y = e.clientY - canvas.offsetTop ||e.touches[0].clientY;
  }

  function onColorUpdate(e){
    current.color = e.target.className.split(' ')[1];
    current.line_width = 3;
  }

function eraseDrawing() {
    console.log("ersed!!");
    current.color = 'black';
    current.line_width = 40;
}


function clearAll() {
    socket.emit('clearCanvas', true); 
    context.clearRect(0, 0, canvas.width, canvas.height);
}

socket.on('clearCanvas', value => {
    context.clearRect(0, 0, canvas.width, canvas.height);
})

  // limit the number of events per second
  function throttle(callback, delay) {
    var previousCall = new Date().getTime();
    return function() {
      var time = new Date().getTime();

      if ((time - previousCall) >= delay) {
        previousCall = time;
        callback.apply(null, arguments);
      }
    };
  }

  function onDrawingEvent(data){
    var w = canvas.width ;
    var h = canvas.height ;
    drawLine(data.x0 * w, data.y0 * h, data.x1 * w  , data.y1 * h, data.color, data.line_width);
  }

  // make the canvas fill its parent
  function onResize() {
    canvas.width = window.innerWidth - 800;
    canvas.height = window.innerHeight - 300;
  }

})();
