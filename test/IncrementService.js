process.env.NODE_ENV = "testing";
var chai = require('chai'),
    expect = chai.expect,
    sinon = require('sinon');
var IncrementService = require("../IncrementService");
var knexfile = require("../knexfile")[process.env.NODE_ENV];
var knex = require('knex')(knexfile);
var Promise = require("bluebird");

before(function(){
    return knex.migrate.latest()
    .then(function(){
        return knex("numbers").del()
    })
});

describe('setting stuff', function(){

    beforeEach(function(){
        IncrementService.clear()
    });

    it('should store new key value', function(done){
        IncrementService.set("un", 1);
        expect(IncrementService.get("un")).to.be.equal(1);
        done()
    });

    it('should store new key value', function(done){
        IncrementService.set("two", 1);
        IncrementService.set("two", 1);
        expect(IncrementService.get("two")).to.be.equal(2);
        done()
    });
});

describe("persistence", function(){
    beforeEach(function(){
        IncrementService.clear()
    });

    it('should be persisting', function(){
        IncrementService.set("future", 1);

        return knex("numbers").where({key: "future"}).select("*")
        .then(function(numbers){
            expect(numbers.length).to.be.equal(0);

            return IncrementService.persist();
        })
        .then(function(number){
            expect(IncrementService.get("future")).to.be.undefined;
            expect(number.length).to.be.equal(1)
        })
    });

    it('should be incrementing', function(){
        IncrementService.set("future", 1);
        return knex("numbers").where({key: "future"}).select("*")
        .then(function(numbers){
            expect(numbers.length).to.be.equal(1);
            return IncrementService.persist();
        })
        .then(function(numbers){
            return knex("numbers").where({key: "future"}).select("*")
        })
        .then(function(numbers){
            expect(numbers[0].value).to.be.equal(2)
        })
    });
});

describe("persistence clock", function(){

    it('should have run persist after 10 seconds', function(){
        var clock = sinon.useFakeTimers();

        IncrementService.clear();
        IncrementService.startPersisting();
        IncrementService.set("clock", 1);
        clock.tick(10e3);
        clock.restore();
        expect(IncrementService.get("clock")).to.be.undefined;

        //give ample time for persistence to have finished
        return new Promise(function(resolve){
            setTimeout(function(){
                resolve()
            }, 1000);
        })
        .then(function(){
            return knex("numbers").where({key: "clock"}).select("*")
        })
        .then(function(numbers){
            expect(numbers.length).to.be.equal(1)
        })
    })

});