import { ContextE } from './composer'
import { Composer } from 'telegraf'
import db from './db'

const actions = new Composer<ContextE>()

actions.action( /generatelink:(\d+):(\d+)/, async ctx => {

	const
		cityId = ctx.match[ 1 ],
		goodId = ctx.match[ 2 ]

	const { name, price, city } = await db( 'goods' )
		.first( 'goods.name', 'price', 'cities.name as city' )
		.where( 'cities.city_id', cityId )
		.where( 'good_id', goodId )
		.leftJoin( 'cities', 'cities.city_id', 'goods.city_id' ) || {}

	if ( !name )
		return ctx.editMessageText( 'Товара больше не существует' )

	const { tg_file_id : fileID } = await db( 'pictures' )
		.first( 'tg_file_id' )
		.where( 'good_id', goodId ) || {}

	await ctx.replyWithPhoto( fileID, {
		protect_content : true,
		reply_to_message_id : ctx.update.callback_query.message?.message_id,
		caption : 'success'
	} )

	return ctx.editMessageText( `
Выбранный товар: ${ name }
Город: ${ city }
Цена: ${ price }₿

Ссылка для оплаты %link%
` )

} )

export default actions