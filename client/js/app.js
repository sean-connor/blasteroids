var socket = io();
var KEY_COMMANDS = {
  38: "up",
  87: "up",
  37: "left",
  65: "left",
  40: "down",
  83: "down",
  39: "right",
  68: "right"
}

var ctx = document.getElementById("ctx").getContext("2d");


ctx.font = '30px Arial';




socket.on('newPosition', function(data){
  ctx.clearRect(0,0,500,500);
  for(var i = 0; i < data.length; i++){
    ctx.fillText(data[i].number, data[i].x, data[i].y);
  }
});

document.onkeydown = function(e){
  e = e || window.event;
  console.log(KEY_COMMANDS[e.keyCode]);
  socket.emit("keyPress", {direction: KEY_COMMANDS[e.keyCode], state: true});
}
document.onkeyup = function(e){
  e = e || window.event;
  console.log(KEY_COMMANDS[e.keyCode]);
  socket.emit("keyPress", {direction: KEY_COMMANDS[e.keyCode], state: false});
}
