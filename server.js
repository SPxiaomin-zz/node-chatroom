var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    users = [];

app.use(express.static(__dirname + '/public'));

server.listen(8080, function() {
    console.log('Server Started at http://localhost:8080');
});

io.on('connection', function(socket) {
    // 在线统计
    socket.on('login', function(nickName) {
        if ( users.indexOf(nickName) > -1 ) {
            socket.emit('nickExisted')
        } else {
            socket.userIndex = users.length;
            socket.nickName = nickName;
            users.push(nickName);
            socket.emit('loginSuccess');

            io.sockets.emit('system', nickName, users.length, 'login');
        }
    });

    socket.on('disconnect', function() {
        users.splice(socket.userIndex, 1);

        socket.broadcast.emit('system', socket.nickName, users.length, 'logout');
    });

    // 分发信息
    socket.on('postMsg', function(msg, color) {
        socket.broadcast.emit('newMsg', socket.nickName, msg, color);
    });

    // 分发图片
    socket.on('img', function(imageData, color) {
        socket.broadcast.emit('newImg', socket.nickName, imageData, color);
    })
});
