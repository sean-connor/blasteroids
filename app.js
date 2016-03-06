var express = require('express');
var app = express();
var serv = require('http').Server(app);
var io = require('socket.io')(serv, {});
var SOCKET_LIST = {};

app.get('/', function(req,res) {
  res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(2000);
console.log("Server Started.");


io.sockets.on('connection', function(socket){
  socket.id = Math.random();
  socket.number = "" + Math.floor(10 * Math.random());
  socket.x = 0;
  socket.y = 0;
  SOCKET_LIST[socket.id] = socket;

  socket.on('disconnect', function(){
    delete SOCKET_LIST[socket.id];
  })


});

setInterval(function(){
  var pack = [];
  for(var i in SOCKET_LIST){
    var socket = SOCKET_LIST[i];
      socket.x++;
      socket.y++;
      pack.push({
        x: socket.x,
        y: socket.y,
        number: socket.number
      })
  }
  for(var i in SOCKET_LIST){
    var socket = SOCKET_LIST[i]
    socket.emit('newPosition', pack);
  }
}, 1000/25);
