var express = require('express');
var app = express();
var serv = require('http').Server(app);
var io = require('socket.io')(serv, {});
var SOCKET_LIST = {};
var PLAYER_LIST = {};
var BULLET_LIST = {};
var HIGH_SCORES = [['---',0],['---',0],['---',0]];
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
var Player = function(id, name){
  var self = {
    name: name,
    points: 0,
    type: 'ship',
    health: 20,
    thrust: 0.4,
    turnSpeed: 0.001,
    angle: 0,
    radius: 10,
    pointLength: 15,
    px: 0,
    py: 0,
    x: (Math.round(Math.random()*800)+1),
    y: (Math.round(Math.random()*600)+1),
    id: id,
    number: "" + Math.floor(10 * Math.random()),
    thrusting: false,
    firing: false,
    fired: false,
    rotating: false,
    rotateDir: 0,
    velocity: [0,0]
  }

  self.updatePosition = function() {
    var radians = this.angle/Math.PI*180;
    if(self.turning){
      self.angle += self.turnSpeed * self.rotateDir;
    }
    if(self.thrusting){
      if((Math.abs(self.velocity[0]) < 4) && (Math.abs(self.velocity[1]) < 4)){
        self.velocity[0] += Math.cos(radians) * this.thrust;
        self.velocity[1] += Math.sin(radians) * this.thrust;
      }
    }
    if(self.x < self.radius){
        self.x = 800;
    }
    if(self.x > 800){
        self.x = self.radius;
    }
    if(self.y < self.radius){
        self.y = 600;
    }
    if(self.y > 600){
        self.y = self.radius;
    }
    self.px = self.x + self.pointLength * Math.cos(radians);
    self.py = self.y + self.pointLength * Math.sin(radians);

    self.velocity[0] *= 0.99;
    self.velocity[1] *= 0.99;

    //FIRING LOGIC
    if(self.firing && !(self.fired)){
      var bulletDirection = [0,0]
      var p_vel = self.velocity;

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
        var bullet = Bullet(self.id, bulletDirection);
        BULLET_LIST[id] = bullet;
      }
      self.fired = true;
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
    hit: false,
    x: PLAYER_LIST[id].x,
    y: PLAYER_LIST[id].y,
    px: PLAYER_LIST[id].px,
    py: PLAYER_LIST[id].py,
    speed: 15,
    dir: [(PLAYER_LIST[id].px - PLAYER_LIST[id].x), (PLAYER_LIST[id].py - PLAYER_LIST[id].y)]
  }
  self.updatePosition = function(){
    self.x += (self.dir[0]*self.speed)/10;
    self.y += (self.dir[1]*self.speed)/10;
  }
  return self;
}

//Collision LOGIC
var checkCollisions = function(){

  for(var i in PLAYER_LIST){
    var player = PLAYER_LIST[i];
    for(var j in BULLET_LIST){
      var bullet = BULLET_LIST[j];
      var bulletPlayer = PLAYER_LIST[bullet.player];
      if (bullet.player == player.id) { continue; };
      var a = Math.abs(player.y - bullet.y);
      var b = Math.abs(player.x - bullet.x);
      if(Math.sqrt((a * a) + (b * b)) <= (player.radius + bullet.radius)){
        if (player.health > 0) {
          player.health -= 1;
          if(bulletPlayer !== undefined){
            bullet.hit = true;
            bulletPlayer.points++;
            if(player.health == 0){
              bulletPlayer.points += 10;
            }
          }
        }
        if(bulletPlayer !== undefined){
          if(HIGH_SCORES[0][1] < bulletPlayer.points){
            if(HIGH_SCORES[0][0] == bulletPlayer.name){
              HIGH_SCORES[0][0] = bulletPlayer.name;
              HIGH_SCORES[0][1] = bulletPlayer.points;
            } else {
            HIGH_SCORES[2][0] = HIGH_SCORES[1][0];
            HIGH_SCORES[2][1] = HIGH_SCORES[1][1];
            HIGH_SCORES[1][0] = HIGH_SCORES[0][0];
            HIGH_SCORES[1][1] = HIGH_SCORES[0][1];
            HIGH_SCORES[0][0] = bulletPlayer.name;
            HIGH_SCORES[0][1] = bulletPlayer.points;
            }
          } else if((HIGH_SCORES[1][1] < bulletPlayer.points) && !(HIGH_SCORES[0][0] == bulletPlayer.name)){
            if(HIGH_SCORES[1][0] == bulletPlayer.name){
              HIGH_SCORES[1][0] = bulletPlayer.name;
              HIGH_SCORES[1][1] = bulletPlayer.points;
            } else {
            HIGH_SCORES[2][0] = HIGH_SCORES[1][0];
            HIGH_SCORES[2][1] = HIGH_SCORES[1][1];
            HIGH_SCORES[1][0] = bulletPlayer.name;
            HIGH_SCORES[1][1] = bulletPlayer.points;
            }
          } else if((HIGH_SCORES[2][1] < bulletPlayer.points) && ((HIGH_SCORES[1][0] !== bulletPlayer.name) && (HIGH_SCORES[0][0] !== bulletPlayer.name))){
            HIGH_SCORES[2][0] = bulletPlayer.name;
            HIGH_SCORES[2][1] = bulletPlayer.points;
          }
        }
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

  socket.on('playerjoin', function(data){
    console.log("Player Join");
    var player = Player(data.id, data.name);
    PLAYER_LIST[socket.id] = player;
  })
  socket.on('disconnect', function(){
    delete SOCKET_LIST[socket.id];
    delete PLAYER_LIST[socket.id];
  })
  socket.on('lossReceipt', function(){
    delete SOCKET_LIST[socket.id];
    delete PLAYER_LIST[socket.id];
  })
  socket.on('input', function(data){
    player = PLAYER_LIST[socket.id];
    if(data.command === 'thrust'){
      player.thrusting = data.state;
    } else if(data.command === 'rotate-l'){
      player.rotateDir = -1;
      player.turning = data.state;
    } else if(data.command === 'rotate-r'){
      player.rotateDir = 1;
      player.turning = data.state;
    } else if(data.command === 'fire'){
      player.firing = data.state;
      if (data.state === false){
        player.fired = false;
      }
    }
  });

});


//RENDER INTERVAL
setInterval(function(){
  checkCollisions();
  var playerpack = [];
  for(var i in PLAYER_LIST){
    var player = PLAYER_LIST[i];
    player.updatePosition();
      playerpack.push({
        name: player.name,
        x: player.x += player.velocity[0],
        y: player.y += player.velocity[1],
        px: player.px,
        py: player.py,
        radius: player.radius,
        number: player.number,
        health: player.health,
        points: player.points,
        id: i
      });
  }
  var bulletpack = [];
  for(var i in BULLET_LIST){
    var bullet = BULLET_LIST[i];
      bullet.updatePosition();
      if ((bullet.hit === false && bullet.x < 800 && bullet.x > 0) && (bullet.y < 600 && bullet.y > 0)){
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
    socket.emit('scores', HIGH_SCORES);
  }
}, 1000/60);
