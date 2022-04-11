import 'dotenv/config'
import { Telegraf } from 'telegraf'
import composer, { ContextE } from './composer'

const token = process.env.TELEGRAM_BOT_TOKEN

if ( !token )
	throw new Error( 'Token must be passed' )

const bot = new Telegraf<ContextE>( token )

bot.use( composer )

bot.launch()
	.then( () => console.log( 'bot started' ) )
	.catch( e => console.log( 'bot can\'t be started', e ) )

process.once( 'SIGINT', () => bot.stop( 'SIGINT' ) )
process.once( 'SIGTERM', () => bot.stop( 'SIGTERM' ) )
