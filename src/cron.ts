import cron from 'node-cron'
import axios from 'axios'
import db from './db'
import { bot } from './index'

const sleep = async ( ms : number ) => new Promise( resolver => setTimeout( resolver, ms ) )

cron.schedule( '00 12 */4 * *', async () => {

	await db( 'payments' )
		.update( {
			status : 2
		} )
		.where( 'status', 0 )

} )

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

		if ( await checkPayment( payment.from, payment.to, payment.amount * 100000000 ) ) {

			try {

				await db( 'payments' )
					.update( {
						status : 1
					} )
					.where( 'payment_id', payment.payment_id )

			} catch ( e ) {
				console.log( 'can\'t set new status for payment', e )
			}

			const { tg_file_id : picture, picture_id : pictureId, caption } = await db( 'pictures' )
				.first( 'tg_file_id', 'picture_id', 'caption' )
				.where( 'good_id', payment.good_id ) || {}

			if ( !pictureId ) {

				await bot.telegram.sendMessage( payment.tg_user_id, 'У данного товара нет изображения, пожалуйста обратитесь в службу поддержки - "ссылка"' )

			} else {

				await db( 'pictures' )
					.update( {
						good_id : null
					} )
					.where( 'picture_id', pictureId )

				await bot.telegram.sendPhoto( payment.tg_user_id, picture, {
					caption
				} )

			}

		}

		await sleep( 1000 )

	}

} )

const checkPayment = async ( from : string, to : string, amount : number ) => {

	try {

		const
			response = await axios.get( `https://api.blockcypher.com/v1/btc/main/addrs/${ to }/full?confirmations=10` ),
			txs = response.data.txs

		for ( const tx of txs ) {

			for ( const input of tx.inputs ) {

				if ( tx.total >= amount ) {

					if ( input.addresses.includes( from ) ) {

						// console.log( `transaction from ${ from } to ${ to } on amount ${ tx.total / 100000000 }, confirmations count = ${ tx.confirmations }` )
						return true

					}

				}

			}

		}

	} catch ( e ) {

		console.log( e )
		return false

	}

	return false

}

// checkPayment( '1KU2MfJBf6trV5BbzRTdaaKbLA8A51AMVd', 'bc1q8vxmlyrnrhkvxve5rgqr3a35dulmlng2ffflat', 0.00130422 )
// checkPayment( 'bc1qacrslxjjfpv38ysxvtpx0qcpmc9zc3rk4fw367', 'bc1qykgcwurx3002n8lhu7f3hsd9jyxk6rg0ush0ch', 3392435 )

// checkPayment( 'bc1q69kn28342galgxwjeqayne0g4h2tfgkxpj3ss3', 'bc1q2rgjpwug0h7e3zl0mkcstsx7gereyftmn60z8l', 10697377 )