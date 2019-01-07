var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const { Client, BlockchainMode } = require('dsteem');
var client = new Client('https://api.steemit.com')
var port = process.env.PORT || 8080;

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


app.use(bodyParser.urlencoded({
    extended: true
}));

app.get('/', function (req, res) {
    res.json({ hello: 'world' });
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


io.on('connection', function (socket) {
    socket.on('message', function (data) {
        io.emit('send', data);
    });
});
