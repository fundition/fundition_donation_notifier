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

io.on('connection', function (socket) {
    socket.on('message', function (data) {
        io.emit('send', data);
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
                op.project= 'gift'
                if(op.from === "fundition" && op.memo === "Your reward for claiming your daily chest on Fundition.io!")
                {
                    io.emit('send', op);
                }
                if (op.memo.includes('Project=Fundition-')) {
                    console.log('this is a donation from ' + op.from)
                    op.memo = op.memo.replace("/", "°")
                    if (op.memo) {
                        var memo = op.memo.split(" ")
                        if (memo[1].split('=')[1])
                        {
                            var name = memo[1].split('=')[1]
                            console.log(name)
                        }

                        else {
                            var name = 'anonymous'
                        }
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


