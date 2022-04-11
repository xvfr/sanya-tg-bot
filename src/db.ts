import knex from 'knex'

const db = knex( {
	client : 'mysql',
	connection : {
		host : process.env.DATABASE_HOST || 'localhost',
		user : process.env.DATABASE_USER,
		password : process.env.DATABASE_PASSWORD,
		database : process.env.DATABASE_NAME
	}
} )

export default db