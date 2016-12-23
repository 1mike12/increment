/**
 * Created by 1mike12 on 12/22/2016.
 */

var env = process.env.NODE_ENV === "testing" ? "testing" : "development";
var knexfile = require("./knexfile")[env];
var knex = require('knex')(knexfile);
var _ = require("lodash");
var Promise = require("bluebird");

module.exports = new function(){
    var self = this;
    var TABLE_NAME = "numbers";
    var key_totals = new Map();

    var interval;

    self.set = function(key, value){
        var oldValue = key_totals.get(key);
        if (oldValue) {
            key_totals.set(key, oldValue + value)
        } else {
            key_totals.set(key, value)
        }
    };

    self.startPersisting = function(){
        interval = setInterval(function(){
            self.persist()
        }, 9900)
    };

    self.stopPersisting = function(){
        clearInterval(interval)
    };

    self.getSavedValue = function(key){
        return knex(TABLE_NAME).where({
            key: key
        }).select('value')
    };

    self.getAllSavedValues = function(){
        return knex(TABLE_NAME).select('*')
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
        console.log("persisted run");

        if (key_totals.size > 0) {

            //[{key: "asd", value: 42}]
            var newNumbers = self.buildInsertionArray();
            var newKeys = _.map(newNumbers, "key");
            key_totals.clear();
            //find all extant keys in database, return
            return knex("numbers").select("*").whereIn("key", newKeys)
            .then(function(numbers){
                var extantNumbers = numbers;
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


                var rawUpdate = "";

                _.forEach(updateNumbers, function(obj){
                    var tempInsert = knex('numbers')
                    .where('key', '=', obj.key)
                    .update({
                        value: obj.value
                    }).toString();
                    rawUpdate += tempInsert + "; ";
                });

                //"update number where key ;
                var promises = [];
                if (updateNumbers.length > 0) {
                    promises.push(knex.raw(rawUpdate))
                }

                if (insertNumbers.length > 0) {
                    promises.push(knex("numbers").insert(insertNumbers))
                }
                return Promise.all(promises)
            });

        } else {
            return Promise.resolve();
        }
    }
};