const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers, users: all } = require('./utils/users');
const { fstat } = require('fs');
const fs = require('fs');
const users = require('./utils/users');
const words = require('./utils/word');
const { deflateRaw } = require('zlib');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));
const botName = 'Doodle Bot';


//io.emit => all clients
// socket.emit => single client
// socket.broadcast.emit => all clients except itself


// run when client connects
io.on('connection', socket => {


    socket.on('joinRoom', ({ username, room }) => {

        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        // Welcome current user
        socket.emit('b_message', formatMessage(botName, 'Welcome to Doodle!'));

        // Broadcast when a user connects
        socket.broadcast.to(user.room)
            .emit('b_message', formatMessage(botName, `${user.username} joined!`));

        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });

    });

    socket.on('correctlyGuessed', (usrName) => {
        const user = getCurrentUser(socket.id);
        socket.to(user.room).emit('b_message', formatMessage(botName, `Word is correctly guessed by ${usrName}`));
    });


    // Listen for chat Message
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);

        let wordd = words[user.room];
        var arr = {
            msg,
            wordd
        }

        io.to(user.room).emit('message', arr, user);
    });


    socket.on('wordTelling', (msg, wordd) => {
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('clear_word_and_result', '');
        io.to(socket.id).emit('word_tell', msg);


        words[user.room] = wordd;

        io.to(user.room).emit('b_message', formatMessage(botName, `${user.username} is drawing`));
    });


    // Drawing --------

        // receives that user wants to clear screen
    socket.on('clearCanvas', value => {
        const user = getCurrentUser(socket.id);
        socket.to(user.room).broadcast.emit('clearCanvas', value)
    })

    socket.on('drawing', (data) => socket.broadcast.emit('drawing', data));

    // Runs when client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if (user) {
            io.to(user.room)
                .emit('b_message', formatMessage(botName, `${user.username} has left`));

            // Send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }

    });

})


const PORT = process.env.PORT || 5000 ;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});




