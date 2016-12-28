var cluster = require('cluster');
var _ = require("lodash");
var path = require("path");

const CPUS = require('os').cpus().length;
const CLUSTER_ON = true;

if (cluster.isMaster && CLUSTER_ON) {

    var IncrementService = require("./IncrementService");
    IncrementService.startPersisting();

    for (var i = 0; i < CPUS; i++) {
        var worker = cluster.fork();
        worker.on('message', function(msg){
            if (_.isArray(msg)) {
                IncrementService.setByArray(msg)
            } else {
                IncrementService.set(msg.key, msg.value)
            }
        });
    }
    cluster.on('exit', function(worker){
        console.log('Worker %d died :(', worker.id);
        cluster.fork();
    });

} else {
    var InputBuffer = require("./InputBuffer");
    var fs = require("fs-promise");

    if (CLUSTER_ON) {
        var inputBuffer = new InputBuffer(1e3);
        inputBuffer.startSynchronizing()
    } else {
        var IncrementService = require("./IncrementService");
        IncrementService.startPersisting();
    }

    var port = process.env.NODE_ENV === "testing" ? 3334 : 3333;
    var app = require("http");

    var handleInput = function(json){
        if (CLUSTER_ON) {
            inputBuffer.set(json.key, json.value)
        } else {
            IncrementService.set(json.key, json.value)
        }
    };

    app.createServer((req, res) =>{
        if (req.method == 'POST' && req.url === "/increment") {
            var body = '';
            req.on('data', (chunk) =>{
                body += chunk;
                //prevent flood of 1MB or more
                if (body.length > 1e6) {
                    body = "";
                    res.writeHead(413, {'Content-Type': 'text/plain'}).end();
                    res.connection.destroy();
                }
            });

            req.on('end', () =>{
                var json = JSON.parse(body);
                var key = json.key;
                var value = json.value;
                if (Number.isInteger(value) && key !== undefined && value) {
                    handleInput(json);
                    res.writeHead(200, 'OK', {'Content-Type': 'text/html'});
                    res.end('');
                } else {
                    res.writeHead(400, 'Error', {'Content-Type': 'text/html'});
                    res.end('');
                }
            })
        } else if (req.method == 'GET') {
            var base = "./public";
            var filePath = base + req.url;

            if (filePath === "./public/")
                filePath = './public/index.html';
            var extensionName = path.extname(filePath);
            var contentType = 'text/html';
            switch (extensionName) {
                case '.js':
                    contentType = 'text/javascript';
                    break;
                case '.css':
                    contentType = 'text/css';
                    break;
                case '.json':
                    contentType = 'application/json';
                    break;
                case '.png':
                    contentType = 'image/png';
                    break;
                case '.jpg':
                    contentType = 'image/jpg';
                    break;
                case '.wav':
                    contentType = 'audio/wav';
                    break;
            }
            fs.readFile(filePath)
            .then(function(content){
                res.writeHead(200, {'Content-Type': contentType});
                res.end(content, 'utf-8');
            })
            .catch(function(){
                res.writeHead(500);
                res.end("error");
                res.end();
            })
        }
    })
    .listen(3333);
    console.log('started server on port:' + port);
    module.exports = app;
}

