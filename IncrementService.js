/**
 * Created by 1mike12 on 12/22/2016.
 */

var env = process.env.NODE_ENV === "testing" ? "testing" : "development";
var knexfile = require("./knexfile")[env];
var knex = require("./db").knex;
var _ = require("lodash");
var Promise = require("bluebird");
var moment = require("moment");

module.exports = new function(){
    var self = this;
    var TABLE_NAME = "numbers";
    var key_totals = new Map();

    var interval;
    var lastRun;

    self.set = function(key, value){
        var oldValue = key_totals.get(key);
        if (oldValue) {
            key_totals.set(key, oldValue + value)
        } else {
            key_totals.set(key, value)
        }
    };

    self.get = function(key){
        return key_totals.get(key)
    };

    self.clear = function(){
        key_totals.clear()
    };

    self.startPersisting = function(){
        if (!interval) {
            interval = setInterval(function(){
                self.persist()
            }, 5e3)
        }
    };

    self.stopPersisting = function(){
        clearInterval(interval)
    };

    self.getSavedValues = function(key){
        return knex(TABLE_NAME).where({
            key: key
        }).select('value')
    };

    self.buildInsertionArray = function(){
        var output = [];
        key_totals.forEach(function(value, key){
            output.push({key: key, value: value})
        });
        return output;
    };

    self.persist = function(){
        // take all stuff in map, convert to a knex compatible format
        // console.log("persisted run");

        if (key_totals.size > 0) {

            //[{key: "asd", value: 42}]
            var newNumbers = self.buildInsertionArray();
            var newKeys = _.map(newNumbers, "key");
            self.clear();
            //find all extant keys in database, return
            return knex("numbers").select("*").whereIn("key", newKeys)
            .then(function(numbers){
                var extantNumbers = numbers;
                console.log("extant numbers: " + JSON.stringify(numbers));
                var extantKeyValueMap = new Map();

                _.forEach(extantNumbers, function(number){
                    extantKeyValueMap.set(number.key, number.value);
                });

                var updateNumbers = [];
                var insertNumbers = [];

                _.forEach(newNumbers, function(newNumber){
                    var extantValue = extantKeyValueMap.get(newNumber.key);
                    if (extantValue !== undefined) {
                        updateNumbers.push({
                            key: newNumber.key,
                            value: extantValue + newNumber.value
                        })
                    } else {
                        insertNumbers.push(newNumber)
                    }
                });

                console.log("updateCount: " + JSON.stringify(updateNumbers));
                console.log("insertCount: " + JSON.stringify(insertNumbers));

                var rawUpdate = "";
                var promises = [];
                _.forEach(updateNumbers, function(obj){
                    var updatePromise = knex('numbers')
                    .where('key', '=', obj.key)
                    .update({
                        value: obj.value
                    });
                    promises.push(updatePromise);

                    // rawUpdate += tempInsert + "; ";
                    // rawUpdate += "UPDATE numbers set value = " + obj.value + " WHERE key = '" + obj.key + "'; "
                });

                if (insertNumbers.length > 0) {
                    promises.push(knex("numbers").insert(insertNumbers))
                }
                return Promise.all(promises)
                .then(function(){
                    if (lastRun === undefined){
                        lastRun = moment()
                    } else {
                        var now = moment();
                        var delta = now.diff(lastRun);
                        lastRun = now;
                        console.log(delta + " ms since last persist");
                        if (delta > 10e3){
                            throw new Error("longer than 10s since last persist")
                        }
                    }
                    return Promise.resolve();
                })
            });

        } else {
            return Promise.resolve();
        }
    }
};