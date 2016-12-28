var Class = function(runInterval){
    this.runInterval = runInterval;
    this.interval = null;
};
var cluster = require('cluster');
var key_totals = new Map();

Class.prototype.startSynchronizing = function(){
    var soi = this;
    if (!soi.interval) {
        soi.interval = setInterval(function(){
            synchronize()
        }, soi.runInterval)
    }
};

Class.prototype.stopSynchronizing = function(){
    clearInterval(this.interval)
};

var synchronize = function(){
    if (key_totals.size > 0) {
        var newNumbers = buildInsertionArray();
        key_totals.clear();
        process.send(newNumbers);
    }
};

var buildInsertionArray = function(){
    var output = [];
    key_totals.forEach(function(value, key){
        output.push({key: key, value: value})
    });
    return output;
};

Class.prototype.set = function(key, value){
    var oldValue = key_totals.get(key);
    if (oldValue) {
        key_totals.set(key, oldValue + value)
    } else {
        key_totals.set(key, value)
    }
};


module.exports = Class;