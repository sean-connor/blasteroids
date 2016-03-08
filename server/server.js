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
    type: 'ship',
    health: 100,
    radius: 15,
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
    type: 'bullet',
    player: id,
    radius: 2,
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

//Collision LOGIC
var checkCollisions = function(){
//Player Collisions
  for(var i in PLAYER_LIST){
    var player1 = PLAYER_LIST[i];
    for(var j in PLAYER_LIST){
      var player2 = PLAYER_LIST[j];
      if (player1 == player2) { continue; };
      var a = Math.abs(player1.y - player2.y);
      var b = Math.abs(player1.x - player2.x);
      if(Math.sqrt((a * a) + (b * b)) <= (player1.radius + player2.radius)){
        player1.health = 0;
        player2.health = 0;
      }
    }
  }
//Bullet to Player Collisions
  for(var i in PLAYER_LIST){
    var player = PLAYER_LIST[i];
    for(var j in BULLET_LIST){
      var bullet = BULLET_LIST[j];
      if (bullet.player == player.id) { continue; };
      var a = Math.abs(player.y - bullet.y);
      var b = Math.abs(player.x - bullet.x);
      if(Math.sqrt((a * a) + (b * b)) <= (player.radius + bullet.radius)){
        player.health -= 1;
        delete bullet;
      }
    }
  }

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
    var p_vel = PLAYER_LIST[socket.id].velocity;

    if (p_vel[0] !== 0 || p_vel[1] !== 0){
      id = Math.random();
      if(p_vel[0] !== 0){
        bulletDirection[0] = p_vel[0];
        //(p_vel[0] > 0) ? bulletDirection[0] = 1 : bulletDirection[0] = -1;
      }
      if(p_vel[1] !== 0){
        bulletDirection[1] = p_vel[1];
        //(p_vel[1] > 0) ? bulletDirection[1] = 1 : bulletDirection[1] = -1;
      }
      var bullet = Bullet(socket.id, bulletDirection);
      BULLET_LIST[id] = bullet;
    }
  })

});


//RENDER INTERVAL
setInterval(function(){
  checkCollisions();
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
