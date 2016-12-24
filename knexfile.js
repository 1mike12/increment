// Update with your config settings.

module.exports = {
    development: {
        client: 'sqlite3',
        connection: {
            filename: "./numbers.db"
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
    testing: {
        client: 'sqlite3',
        connection: {
            filename: "./numbers_test.db"
        },
        migrations: {
            tableName: 'migrations',
            directory: './migrations'
        },
        seeds: {
            directory: './migrations/seeds'
        },
        debug: false

    }
};