var cluster = require('cluster'),
    numCPUs = require('os').cpus().length;

var clusterEnabled = false;
var knex = require("./db").knex;

return knex.migrate.latest()
.then(function(){
    if (cluster.isMaster && clusterEnabled) {
        for (var i = 0; i < numCPUs; i++) {
            cluster.fork();
        }
        cluster.on('exit', function(worker){
            console.log('Worker %d died :(', worker.id);
            cluster.fork();
        });
    } else {
        var IncrementService = require("./IncrementService");
        IncrementService.startPersisting();
        var express = require("express");
        var app = express();
        var BodyParser = require("body-parser");
        app.use(BodyParser.json());
        app.use(BodyParser.urlencoded({extended: true}));

        app.post('/increment', function(req, res){
            var body = req.body;
            var key = body.key;
            var value = body.value;
            if (Number.isInteger(value) && key !== undefined && value) {
                IncrementService.set(key, value);
                res.sendStatus(200)
            } else {
                res.sendStatus(422)
            }
        });


        app.get('/numbers', function(req, res){

            return IncrementService.getAllSavedValues()
            .then(function(output){
                res.send(output)
            })
        });

        app.get('/persist', function(req, res){

            return IncrementService.persist()
            .then(function(){
                res.send("persisted")
            })
        });

        var port = process.env.NODE_ENV === "testing" ? 3334 : 3333;
        var server = app.listen(port, function(){
            var host = server.address().address;
            var port = server.address().port;
            console.log('started server on port:' + port);
        });

        module.exports = app;
    }
});

