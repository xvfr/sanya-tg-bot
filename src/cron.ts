import cron from 'node-cron'
import axios from 'axios'
import db from './db'

cron.schedule( '* * * * *', async () => {

	/*
	 * Statuses
	 *
	 * 0 - in process
	 * 1 - paid
	 * 2 - canceled
	 * 3 - error
	 * */

	const payments = await db( 'payments' )
		.select()
		.where( 'status', 0 )

	for ( const payment of payments ) {


	}

} )

const checkPayment = async ( from : string, to : string, amount : number ) : Promise<boolean> => {

	const response = await axios.get( `https://blockchain.info/rawaddr/${ to }` )

	const txs = response.data.txs

	for ( const tx of txs ) {

		for ( const input of tx.inputs ) {

			if ( input.prev_out.addr === from ) {
				console.log( `transaction from ${ from } to ${ to } on amount ${ tx.result }, confirmations count = ${tx.ver}` )
				return true
			}

		}

	}

	return false

}

// checkPayment( '1KU2MfJBf6trV5BbzRTdaaKbLA8A51AMVd', 'bc1q8vxmlyrnrhkvxve5rgqr3a35dulmlng2ffflat', 0.00130422 )
// checkPayment( 'bc1qacrslxjjfpv38ysxvtpx0qcpmc9zc3rk4fw367', 'bc1qykgcwurx3002n8lhu7f3hsd9jyxk6rg0ush0ch', 3392435 )