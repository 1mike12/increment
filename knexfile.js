// Update with your config settings.

module.exports = {
    development: {
        client: 'sqlite3',
        connection: {
            filename: "./db.sqlite"
        },
        migrations: {
            tableName: 'migrations',
            directory: './migrations'
        },
        seeds: {
            directory: './migrations/seeds'
        },
        debug: true

    },
    testing: {
        client: 'sqlite3',
        connection: {
            filename: "./db.sqlite"
        },
        migrations: {
            tableName: 'migrations',
            directory: './migrations'
        },
        seeds: {
            directory: './migrations/seeds'
        },
        debug: false

    },
    //faster in-memory sqlite db, but shit doesn't work with FK and other parameters not created from migration
    // testing: {
    //     client: 'sqlite3',
    //     connection: {
    //         filename: ':memory:'
    //     },
    //     migrations: {
    //         tableName: 'migrations',
    //         directory: './migrations'
    //     },
    //     seeds: {
    //         directory: './migrations/seeds'
    //     },
    //     debug: true
    // },
};