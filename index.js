const { Client, BlockchainMode } = require('dsteem');
const express = require('express')
const app = express()
const port = process.env.PORT || 4000
var http = require('http').Server(app);
var io = require('socket.io')(http);
var client = new Client('https://api.steemit.com')

http.listen(port, function () {
    console.log('Server Started. Listening on *:' + port);
});

var chatters = [];
var chat_messages = [];
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});


app.get('/', function (req, res) {
    res.json({ hello: 'world' });
});

app.post('/join', function (req, res) {
    var username = req.body.username;
    if (chatters.indexOf(username) === -1) {
        chatters.push(username);
        res.send({
            'chatters': chatters,
            'status': 'OK'
        });
    } else {
        res.send({
            'status': 'FAILED'
        });
    }
});

app.post('/leave', function (req, res) {
    var username = req.body.username;
    chatters.splice(chatters.indexOf(username), 1);
    res.send({
        'status': 'OK'
    });
});

app.post('/send_message', function (req, res) {
    var room = req.body.room;
    var username = req.body.username;
    var message = req.body.message;
    var date = new Date().toUTCString()
    chat_messages.push({
        'room': room,
        'sender': username,
        'message': message,
        'date': date
    });
    res.send({
        'status': 'OK'
    });
});

app.get('/get_messages', function (req, res) {
    res.send(chat_messages);
});

app.get('/get_chatters', function (req, res) {
    res.send(chatters);
});

io.on('connection', function (socket) {
    socket.on('message', function (data) {
        io.emit('send', data);
    });
    socket.on('update_chatter_count', function (data) {
        io.emit('count_chatters', data);
    });

});


var stream = client.blockchain.getBlockStream({ mode: BlockchainMode.Latest })
stream.on("data", function (block) {
    if (block != null) {
        try {
            var object = JSON.stringify(block.transactions)
            object.replace("\\", "")
            object = JSON.parse(object)
        } catch (error) {
            console.log(error)
        }
        for (i = 0; i < object.length; i++) {
            if (object[i].operations[0][0] === "transfer") {
                var op = object[i].operations[0][1]
                var block = object[i].block_num
                console.log(op)
                io.emit('send', op);
                if (op.memo.includes('Fundition-') || op.memo.includes('fundition-') || op.memo.includes('Project=Fundition-') && op.to != 'smartmarket') {
                    console.log('this is a donation from ' + op.from)
                    op.memo = op.memo.replace("/", "°")
                    if (op.memo) {
                        var memo = op.memo.split(" ")
                        if (memo[1].split('=')[1])
                            var name = memo[1].split('=')[1]
                        else {
                            var name = 'anonymous'
                        }
                        // if (op.from === "blocktrades") {
                        //     WriteDonation(block, name, op, memo)
                        // }
                        // if
                        //     (op.from === "fundition") {
                        //     WriteDonation(block, name, op, memo)
                        // }
                        // else {
                        //     WriteDonation(block, name, op, memo)
                        // }
                    }

                }
            }
        }
    }
})
    .on('end', function () {
        // done
        console.log('END');
    });


