import { Composer, Markup, Scenes } from 'telegraf'
import db from '../db'
import { ContextE } from '../composer'

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

	ctx.session.goodId = goodId

	ctx.reply( `
Выбранный товар: ${ name }
Цена: ${ price }₿

Сгенерировать ссылку на оплату?
`, Markup.inlineKeyboard( [
		Markup.button.callback( 'Сгенерировать', `generatelink:${ cityId }:${ goodId }` )
	] ) )

} )

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
	selectGoodHandler
)


export default buyMenu