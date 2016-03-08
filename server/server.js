var express = require('express');
var app = express();
var serv = require('http').Server(app);
var io = require('socket.io')(serv, {});
var SOCKET_LIST = {};
var PLAYER_LIST = {};
var BULLET_LIST = {};
var PLAYER_DIRECTION = {
  'pressingRight': [1,0],
  'pressingLeft': [-1,0],
  'pressingUp': [0,-1],
  'pressingDown': [0,1]
};
app.use(express.static(__dirname + '/../client'));

//serv.listen(2000);
serv.listen(process.env.PORT);
console.log("Server Started.");

//PLAYER LOGIC
var Player = function(id){
  var self = {
    health: 100,
    x: 250,
    y: 250,
    id: id,
    number: "" + Math.floor(10 * Math.random()),
    pressingRight: false,
    pressingLeft: false,
    pressingUp: false,
    pressingDown: false,
    curSpeed: 0,
    maxSpeed: 3,
    velocity: [0,0]
  }
  self.updatePosition = function() {
    if(self.pressingRight){
      if (self.x > 1000){
        self.x = 1;
      } else {
        if(self.velocity[0] < self.maxSpeed){
          self.velocity[0] = self.velocity[0] + 1;
        }
      }
    }
    if(self.pressingLeft){
      if (self.x <= 0){
        self.x = 1000;
      } else {
        if(-(self.velocity[0]) < self.maxSpeed){
          self.velocity[0] = self.velocity[0] - 1;
        }
      }
    }
    if(self.pressingUp){
      if (self.y <= 0){
        self.y = 600;
      } else {
        if(-(self.velocity[1]) < self.maxSpeed){
          self.velocity[1] = self.velocity[1] - 1;
        }
      }
    }
    if(self.pressingDown){
      if (self.y > 600){
        self.y = 1;
      } else {
        if(self.velocity[1] < self.maxSpeed){
          self.velocity[1] = self.velocity[1] + 1;
        }
      }
    }
  }
  return self;
}


//BULLET LOGIC
var Bullet = function(id, bullet_dir){
  var self = {
    x: PLAYER_LIST[id].x,
    y: PLAYER_LIST[id].y,
    speed: 15,
    dir: bullet_dir
  }
  self.updatePosition = function(){
    self.x += self.dir[0]*self.speed;
    self.y += self.dir[1]*self.speed;
  }
  return self;
}

// SOCKET
io.sockets.on('connection', function(socket){
  console.log("Client Connected");
  socket.id = Math.random();
  socket.emit('token', socket.id);
  SOCKET_LIST[socket.id] = socket;
  var player = Player(socket.id);
  PLAYER_LIST[socket.id] = player;

  socket.on('disconnect', function(){
    delete SOCKET_LIST[socket.id];
    delete PLAYER_LIST[socket.id];
  })

  socket.on('move', function(data){
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
  socket.on('fire', function(data){
    var bulletDirection = [0,0]
    if (PLAYER_LIST[socket.id].pressingRight){
      bulletDirection[0] += PLAYER_DIRECTION['pressingRight'][0];
      bulletDirection[1] += PLAYER_DIRECTION['pressingRight'][1];
    }
    if (PLAYER_LIST[socket.id].pressingLeft){
      bulletDirection[0] += PLAYER_DIRECTION['pressingLeft'][0];
      bulletDirection[1] += PLAYER_DIRECTION['pressingLeft'][1];
    }
    if (PLAYER_LIST[socket.id].pressingUp){
      bulletDirection[0] += PLAYER_DIRECTION['pressingUp'][0];
      bulletDirection[1] += PLAYER_DIRECTION['pressingUp'][1];
    }
    if (PLAYER_LIST[socket.id].pressingDown){
      bulletDirection[0] += PLAYER_DIRECTION['pressingDown'][0];
      bulletDirection[1] += PLAYER_DIRECTION['pressingDown'][1];
    }
    console.log(bulletDirection);
    if (bulletDirection[0] !== 0 || bulletDirection[1] !== 0){
      id = Math.random();
      var bullet = Bullet(socket.id, bulletDirection);
      BULLET_LIST[id] = bullet;
    }
  })

});


//RENDER INTERVAL
setInterval(function(){
  var playerpack = [];
  for(var i in PLAYER_LIST){
    var player = PLAYER_LIST[i];
    player.updatePosition();
      playerpack.push({
        x: player.x += player.velocity[0],
        y: player.y += player.velocity[1],
        number: player.number,
        health: player.health,
        id: i
      });
  }
  var bulletpack = [];
  for(var i in BULLET_LIST){
    var bullet = BULLET_LIST[i];
      bullet.updatePosition();
      if ((bullet.x < 1000 && bullet.x > 0) && (bullet.y < 600 && bullet.y > 0)){
        bulletpack.push({
          x: bullet.x,
          y: bullet.y,
        });
      } else {
        delete bullet;
      }
  }
  for(var i in SOCKET_LIST){
    var socket = SOCKET_LIST[i]
    socket.emit('newPosition', playerpack);
    socket.emit('bullets', bulletpack);
  }
}, 1000/32);
