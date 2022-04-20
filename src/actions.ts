// import { ContextE } from './composer'
// import { Composer } from 'telegraf'
// import db from './db'
//
// const actions = new Composer<ContextE>()

// actions.action( /generatelink:(\d+):(\d+)/, async ctx => {
//
// 	const
// 		cityId = ctx.match[ 1 ],
// 		goodId = ctx.match[ 2 ]
//
// 	const { name, price, city } = await db( 'goods' )
// 		.first( 'goods.name', 'price', 'cities.name as city' )
// 		.where( 'cities.city_id', cityId )
// 		.where( 'good_id', goodId )
// 		.leftJoin( 'cities', 'cities.city_id', 'goods.city_id' ) || {}
//
// 	if ( !name )
// 		return ctx.editMessageText( 'Товара больше не существует' )
//
// 	return ctx.editMessageText( `
// Выбранный товар: ${ name }
// Город: ${ city }
// Цена: ${ price }₿
//
// Ссылка для оплаты %link%
// ` )
//
// } )

// export default actions