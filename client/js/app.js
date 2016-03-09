var socket = io();
var KEY_COMMANDS = {
  38: "thrust",
  87: "thrust",
  37: "rotate-l",
  65: "rotate-l",
  39: "rotate-r",
  68: "rotate-r"
}
var socketId;
var ctx = document.getElementById("ctx").getContext("2d");


ctx.font = '30px Arial';


socket.on('token', function(data){
  socketId = data;
  console.log(socketId);
});

socket.on('newPosition', function(data){
  ctx.clearRect(0,0, 800,600);
  ctx.fillStyle = "black";
  ctx.fillRect(0,0,800,600);
  for(var i = 0; i < data.length; i++){
    // x = data[i].x;
    // y = data[i].y;
    // ctx.beginPath();
    // ctx.moveTo(x, y);
    // ctx.lineTo(x + 25, y + 25);
    // ctx.lineTo(x + 25, y + (-25));
    // ctx.scale(1,1);
    // ctx.rotate(Math.PI / 1);
    // ctx.fill();
    healthX = data[i].x - 30;
    healthY = data[i].y + 40;
    ctx.beginPath()
    ctx.arc(data[i].x, data[i].y, 15, 0, 2 * Math.PI, false);
    ctx.fillStyle = "#f8f8ff";
    ctx.strokeStyle = "#f8f8ff";
    if(data[i].id == socketId){
      ctx.strokeStyle = 'red';

    }
    ctx.fillText(data[i].health, healthX, healthY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(data[i].x, data[i].y);
    ctx.lineTo(data[i].px, data[i].py);
    ctx.closePath();
    ctx.stroke();
  }
});
socket.on('bullets', function(data){
  for(var i = 0; i < data.length; i++){
    ctx.beginPath()
    ctx.arc(data[i].x, data[i].y, 2, 0, 2 * Math.PI, false);
    ctx.fill();
  }
});

document.onkeypress = function(e){
  e = e || window.event;
  if(e.keyCode === 32){
    socket.emit("fire", {})
  }
}
document.onkeydown = function(e){
  e = e || window.event;
  socket.emit("move", {direction: KEY_COMMANDS[e.keyCode], state: true});
}
document.onkeyup = function(e){
  e = e || window.event;
  socket.emit("move", {direction: KEY_COMMANDS[e.keyCode], state: false});
}
