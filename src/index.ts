import 'dotenv/config'
import { Telegraf } from 'telegraf'
import composer, { ContextE } from './composer'

const token = process.env.TELEGRAM_BOT_TOKEN

if ( !token )
	throw new Error( 'Token must be passed' )

if ( !process.env.WALLET )
	throw new Error( 'Wallet must be passed' )

export const bot = new Telegraf<ContextE>( token )

bot.use( composer )

bot.launch()
	.then( () => console.log( 'bot started' ) )
	.catch( e => console.log( 'process error', e ) )

import './cron'

process.once( 'SIGINT', () => bot.stop( 'SIGINT' ) )
process.once( 'SIGTERM', () => bot.stop( 'SIGTERM' ) )
