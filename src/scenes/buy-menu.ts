import { Composer, Markup, Scenes } from 'telegraf'
import db from '../db'
import { ContextE } from '../composer'

const escape = ( value : string ) => value
	.replace( /\_/g, '\\_' )
	.replace( /\*/g, '\\*' )
	.replace( /\[/g, '\\[' )
	.replace( /\]/g, '\\]' )
	.replace( /\(/g, '\\(' )
	.replace( /\)/g, '\\)' )
	.replace( /\~/g, '\\~' )
	.replace( /\`/g, '\\`' )
	.replace( /\>/g, '\\>' )
	.replace( /\#/g, '\\#' )
	.replace( /\+/g, '\\+' )
	.replace( /\-/g, '\\-' )
	.replace( /\=/g, '\\=' )
	.replace( /\|/g, '\\|' )
	.replace( /\{/g, '\\{' )
	.replace( /\}/g, '\\}' )
	.replace( /\./g, '\\.' )
	.replace( /\!/g, '\\!' )

// select city

const selectCityStep = async ( ctx : ContextE ) => {
	const cities = await db( 'cities' )
		.select( 'name' )

	if ( !cities.length )
		return ctx.reply( 'В данный момент нет добавленных городов, попробуйте позже!' )

	await ctx.wizard.next()

	const citiesKeyboard = cities.map( c => c.name )

	return ctx.reply( 'Выберите город', Markup
		.keyboard( citiesKeyboard, {
			columns : 3
		} )
		.resize()
		.placeholder( 'Нажмите на кнопку для выбора' )
	)
}

const selectCityHandler = new Composer<ContextE>()
selectCityHandler.start( ctx => ctx.scene.reenter() )

selectCityHandler.hears( /.+/, async ctx => {

	const { city_id : cityId } = await db( 'cities' )
		.first( 'city_id' )
		.where( 'name', ctx.match[ 0 ] ) || {}

	if ( !cityId )
		return ctx.reply( 'Данный город пока не добавлен' )

	ctx.session.cityId = cityId

	return selectGoodStep( ctx )
} )

// select good

const selectGoodHandler = new Composer<ContextE>()
selectGoodHandler.start( ctx => ctx.scene.reenter() )
selectGoodHandler.hears( 'Назад', async ctx => {
	return ctx.wizard.back(), ctx.wizard.back(), selectCityStep( ctx )
} )

selectGoodHandler.hears( /.+/, async ctx => {

	const
		cityId = ctx.session.cityId,
		name = ctx.match[ 0 ],
		{ good_id : goodId, price } = await db( 'goods' )
			.first( 'good_id', 'price' )
			.where( 'name', name )
			.where( 'city_id', cityId )
		|| {}

	if ( !goodId )
		return ctx.reply( 'Произошла ошибка, попробуйте выбрать другой товар' )

	const picture = await db( 'pictures' )
		.first()
		.where( 'good_id', goodId )

	if ( !picture )
		return ctx.reply( 'Данного товара нет в наличии, попробуйте выбрать другой' )

	ctx.session.goodId = goodId

	await ctx.wizard.next()

	return ctx.reply( `Выбранный товар: ${ name }
Цена: ${ price }₿
	
Введите адрес кошелька с которого будет сделан перевод:`, Markup.keyboard( [ 'Назад' ] ).resize() )

} )

// select from btc address

const selectAddressHandler = new Composer<ContextE>()
selectAddressHandler.start( ctx => ctx.scene.reenter() )
selectAddressHandler.hears( 'Назад', async ctx => {
	return ctx.wizard.back(), ctx.wizard.back(), selectGoodStep( ctx )
} )

selectAddressHandler.hears( /.+/, async ctx => {

	const wallet = ctx.match[ 0 ]

	if ( !String( wallet ) || wallet.length > 200 )
		return ctx.reply( 'Введите действительный адрес кошелька' )

	// try {
	// 	await axios.get( `https://api.blockcypher.com/v1/btc/main/addrs/${ wallet }` )
	// } catch ( e ) {
	// 	return ctx.reply( 'Введите действительный адрес кошелька' )
	// }

	const good = await db( 'goods' )
		.first( 'goods.name', 'goods.price', 'good_id', 'cities.name as city' )
		.where( 'good_id', ctx.session.goodId )
		.leftJoin( 'cities', 'cities.city_id', 'goods.city_id' )

	if ( !good )
		return ctx.reply( 'Произошла ошибка, попробуйте позднее' ), ctx.scene.reenter()

	try {

		await db( 'payments' )
			.insert( {
				tg_user_id : ctx.message.from.id,
				from : wallet,
				to : process.env.WALLET,
				good_id : good.good_id,
				amount : good.price
			} )

		await ctx.replyWithMarkdownV2( `
Вы выбрали _${ escape( good.name ) }_ в городе ***${ escape( good.city ) }*** на сумму *${ escape( String( good.price ) ) }₿*
	
Переведите на адрес \`${ process.env.WALLET }\` *${ escape( String( good.price ) ) }₿* для покупки
После получения *8* подтверждений Вам придет сообщение
	
Ожидается перевод с \`${ wallet }\` на \`${ process.env.WALLET }\`
	
Внимательно проверьте адрес кошелька перевода и получателя
` )

	} catch ( e ) {

		console.log( 'payment error', e )
		await ctx.reply( 'Произошла ошибка, попробуйте позднее' )

	}

	return ctx.scene.reenter()

} )

//

const selectGoodStep = async ( ctx : ContextE ) => {
	const goods = await db( 'goods' )
		.select( 'name' )
		.where( 'city_id', ctx.session.cityId )
		.andWhere( 'price', '>', 0 )

	if ( !goods.length )
		return ctx.reply( 'В данный момент нет добавленных товаров, попробуйте позже!' )

	await ctx.wizard.next()

	const keyboard : string[] = goods.map( c => c.name )

	keyboard.push( 'Назад' )

	return ctx.reply( 'Выберите товар', Markup
		.keyboard( keyboard, {
			columns : 3
		} )
		.resize()
		.placeholder( 'Нажмите на кнопку для выбора' )
	)
}

// menu

const buyMenu = new Scenes.WizardScene(
	'buy-menu',

	ctx => selectCityStep( ctx ),
	selectCityHandler,
	selectGoodHandler,
	selectAddressHandler
)

export default buyMenu