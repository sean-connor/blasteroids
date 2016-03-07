var express = require('express');
var app = express();
var serv = require('http').Server(app);
var io = require('socket.io')(serv, {});
var SOCKET_LIST = {};
var PLAYER_LIST = {};

app.use(express.static(__dirname + '/../client'));

serv.listen(2000);
//serv.listen(process.env.PORT);
console.log("Server Started.");

//PLAYER LOGIC
var Player = function(id){
  var self = {
    x: 250,
    y: 250,
    id: id,
    number: "" + Math.floor(10 * Math.random()),
    pressingRight: false,
    pressingLeft: false,
    pressingUp: false,
    pressingDown: false,
    maxVel: 5
  }
  self.updatePosition = function() {
    if(self.pressingRight){
      self.x += self.maxVel;
    }
    if(self.pressingLeft){
      self.x -= self.maxVel;
    }
    if(self.pressingUp){
      self.y -= self.maxVel;
    }
    if(self.pressingDown){
      self.y += self.maxVel;
    }
  }
  return self;
}

// SOCKET
io.sockets.on('connection', function(socket){
  console.log("Client Connected");
  socket.id = Math.random();
  SOCKET_LIST[socket.id] = socket;
  var player = Player(socket.id);
  PLAYER_LIST[socket.id] = player;

  socket.on('disconnect', function(){
    delete SOCKET_LIST[socket.id];
    delete PLAYER_LIST[socket.id];
  })

  socket.on('keyPress', function(data){
    if(data.direction === 'up'){
      player.pressingUp = data.state;
    } else if(data.direction === 'down'){
      player.pressingDown = data.state;
    } else if(data.direction === 'left'){
      player.pressingLeft = data.state;
    } else if(data.direction === 'right'){
      player.pressingRight = data.state;
    }
  });


});


//RENDER INTERVAL
setInterval(function(){
  var pack = [];
  for(var i in PLAYER_LIST){
    var player = PLAYER_LIST[i];
    player.updatePosition();

      pack.push({
        x: player.x,
        y: player.y,
        number: player.number
      });
  }
  for(var i in SOCKET_LIST){
    var socket = SOCKET_LIST[i]
    socket.emit('newPosition', pack);
  }
}, 1000/25);
