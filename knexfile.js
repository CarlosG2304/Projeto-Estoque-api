require('dotenv').config()

module.exports =  {
    client: 'postgresql',
    connection: {
      host:'localhost',
      database: 'postgres',
      user:     'postgres',
      password: process.env.senhaDB
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }
