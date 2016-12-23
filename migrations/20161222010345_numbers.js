var TABLE_NAME = "numbers";
/*
 CREATE TABLE numbers (key TEXT, value INTEGER DEFAULT 0);
 CREATE UNIQUE INDEX numbers_key_index ON numbers (key);
 */
exports.up = function(knex, Promise){
    return knex.schema.createTableIfNotExists(TABLE_NAME, function(table){
        table.text("key");
        table.index("key", "numbers_key_index");
        table.integer("value").defaultTo(0);
    });
};

exports.down = function(knex, Promise){
    return knex.schema.dropTableIfExists(TABLE_NAME)
};