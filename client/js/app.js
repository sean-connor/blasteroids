var socket = io();
var KEY_COMMANDS = {
  38: "thrust",
  87: "thrust",
  37: "rotate-l",
  65: "rotate-l",
  39: "rotate-r",
  68: "rotate-r",
  32: "fire"
}
var HIGH_SCORES=[];
var socketId;
var ctx = document.getElementById("ctx").getContext("2d");
var ctxLead = document.getElementById("ctx").getContext("2d");
var active = false;

ctx.font = '30px Arial';


socket.on('token', function(data){
  socketId = data;
  ctx.clearRect(0,0, 800,600);
  ctx.fillStyle = "rgba(0,0,0,0)";
  ctx.fillRect(0,0,800,600);
  ctx.fillStyle = "white";
  ctx.strokeStyle = "white";
  ctx.fillText("Enter Name to Join!", 400, 300);
});

$(document).ready(function() {

    $("#nameSubmit").click(function(e){
      if(active === false){
        var name = $('#nameInput').val().toLowerCase();
        name = name.substring(0,3);
        name = name + ":";
        socket.emit("playerjoin", {id: socketId, name: name})
        window.addEventListener("keyup", keyup);
        window.addEventListener("keydown", keydown);
        active = true;
      }
    });
});


socket.on('newPosition', function(data){
  ctx.clearRect(0,0, 800,600);

  //Ships and Turrets
  for(var i = 0; i < data.length; i++){
    nameX = data[i].x - 30;
    textY = data[i].y + 40;
    healthX = data[i].x + 10;
    ctx.beginPath()
    ctx.arc(data[i].x, data[i].y, 10, 0, 2 * Math.PI, false);
    ctx.fillStyle = "rgba(200,50,50, 0.5)";;
    ctx.strokeStyle = "#f8f8ff";
    if(data[i].id == socketId){
      ctx.fillStyle = "rgba(50,100,200, 0.5)";
      if (data[i].health <= 0) {
        socket.emit("lossReceipt");
        gameLoss(data[i].points);
        {break;}
      }
    }
    ctx.fill();
    ctx.stroke();
    //Turrets
    ctx.beginPath();
    ctx.moveTo(data[i].x, data[i].y);
    ctx.lineTo(data[i].px, data[i].py);
    ctx.closePath();
    ctx.fill();
    //ctx.stroke();

    //Text
    ctx.fillStyle = "#f8f8ff";
    ctx.strokeStyle = "#f8f8ff";

    ctx.font = "20px Georgia";
    ctx.fillText(data[i].name, nameX, textY);
    ctx.fillText(data[i].health, healthX, textY);
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
socket.on('scores', function(data){
  if(HIGH_SCORES.length === 0){
    HIGH_SCORES = data
  }
  first = data[0][0] + " " + data[0][1];
  second = data[1][0] + " " + data[1][1];
  third = data[2][0] + " " + data[2][1];
  $("#first")[0].innerHTML = first;
  $("#second")[0].innerHTML = second;
  $("#third")[0].innerHTML = third;
});
var gameLoss = function(points){
  ctx.clearRect(0,0, 800,600);

  ctx.fillStyle = "white";
  ctx.strokeStyle = "white";
  ctx.fillText("Game Over!", 300, 200);
  ctx.fillText("Points:", 300, 250);
  ctx.fillText(points, 370, 250);
  active = false;
}

function keydown(e){
  e = e || window.event;
  socket.emit("input", {command: KEY_COMMANDS[e.keyCode], state: true});
}
function keyup(e){
  e = e || window.event;
  socket.emit("input", {command: KEY_COMMANDS[e.keyCode], state: false});
}
