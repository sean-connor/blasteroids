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
window.addEventListener("keyup", keyup);
window.addEventListener("keydown", keydown);
window.addEventListener("keypress", keypress);

ctx.font = '30px Arial';


socket.on('token', function(data){
  socketId = data;
  console.log(socketId);
});

socket.on('newPosition', function(data){
  ctx.clearRect(0,0, 800,600);
  ctx.fillStyle = "black";
  ctx.fillRect(0,0,800,600);
  //Ships and Turrets
  for(var i = 0; i < data.length; i++){
    healthX = data[i].x - 30;
    healthY = data[i].y + 40;
    ctx.beginPath()
    ctx.arc(data[i].x, data[i].y, 15, 0, 2 * Math.PI, false);
    ctx.fillStyle = "#f8f8ff";
    ctx.strokeStyle = "#f8f8ff";
    if(data[i].id == socketId){
      ctx.strokeStyle = 'red';
      if (data[i].health <= 0) {
        socket.emit("lossReceipt");
        gameLoss();
        {break;}
      }
    }
    ctx.fillText(data[i].health, healthX, healthY);
    ctx.stroke();
    //Turrets
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
var gameLoss = function(){
  console.log("GAME LOSS");
  ctx.clearRect(0,0, 800,600);
  ctx.fillStyle = "black";
  ctx.fillRect(0,0,800,600);
  ctx.fillStyle = "white";
  ctx.strokeStyle = "white";
  ctx.fillText("Game Over", 400, 300);
  console.log("Post Render Game Loss");
}
function keypress(e){
  e = e || window.event;
  if(e.keyCode === 32){
    socket.emit("fire", {})
  }
}
function keydown(e){
  e = e || window.event;
  socket.emit("move", {direction: KEY_COMMANDS[e.keyCode], state: true});
}
function keyup(e){
  e = e || window.event;
  socket.emit("move", {direction: KEY_COMMANDS[e.keyCode], state: false});
}
