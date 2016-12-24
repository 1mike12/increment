var env = process.env.NODE_ENV === "testing" ? "testing" : "development";
var knexfile = require("./knexfile")[env];
module.exports = {
    knex : require('knex')(knexfile)
};