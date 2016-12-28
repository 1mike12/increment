var cluster = require('cluster');
numCPUs = require('os').cpus().length;
const CLUSTER_ON = true;

if (cluster.isMaster && CLUSTER_ON) {

    var IncrementService = require("./IncrementService");
    IncrementService.startPersisting();

    for (var i = 0; i < numCPUs; i++) {
        var worker = cluster.fork();
        worker.on('message', function(msg){
            IncrementService.set(msg.key, msg.value)
        });
    }
    cluster.on('exit', function(worker){
        console.log('Worker %d died :(', worker.id);
        cluster.fork();
    });

} else {

    if (!CLUSTER_ON) {
        var IncrementService = require("./IncrementService");
        IncrementService.startPersisting();
    }

    var port = process.env.NODE_ENV === "testing" ? 3334 : 3333;
    var app = require("http");

    var handleInput = function(json){
        if (CLUSTER_ON) {
            process.send(json);
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
        }
    })
    .listen(3333);
    console.log('started server on port:' + port);
    module.exports = app;
}

