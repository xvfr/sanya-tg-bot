import { Composer, Markup, Scenes } from 'telegraf'
import db from '../../db'
import { ContextE } from '../../composer'

// select city for delete

const selectCityHandler = new Composer<ContextE>()

selectCityHandler.hears( 'Отменить', ctx => ctx.scene.enter( 'settings' ) )

selectCityHandler.hears( /.+/, async ( ctx ) => {

	const
		cityName = ctx.match[ 0 ],
		{ city_id : cityId } = await db( 'cities' )
			.first( 'city_id' )
			.where( 'name', cityName ) || {}

	if ( !cityId )
		return ctx.reply( 'Данного города нет в базе, попробуйте выбрать другой' )

	const
		goods = await db( 'goods' )
			.select( 'name' )
			.where( 'city_id', cityId )

	if ( !goods.length )
		return ctx.reply( 'В данной категории нет товаров' )

	ctx.session.cityId = cityId

	const
		keyboard = goods.map( g => g.name )

	keyboard.push( 'Назад' )
	keyboard.push( 'Отменить' )

	await ctx.wizard.next()
	return ctx.reply( 'Выберите товар для удаления', Markup.keyboard( keyboard, { columns : 3 } ).resize() )

} )


// select good for delete

const selectGoodHandler = new Composer<ContextE>()

selectGoodHandler.hears( 'Назад', ctx => ctx.scene.reenter() )
selectGoodHandler.hears( 'Отменить', ctx => ctx.scene.enter( 'settings' ) )

selectGoodHandler.hears( /.+/, async ( ctx ) => {

	const
		goodName = ctx.match[ 0 ],
		{ good_id : goodId } = await db( 'goods' )
			.first( 'good_id' )
			.where( 'city_id', ctx.session.cityId )
			.where( 'name', goodName ) || {}

	if ( !goodId )
		return ctx.reply( 'Данного товара нет в базе, попробуйте выбрать другой' )

	ctx.session.goodId = goodId

	await ctx.wizard.next()
	return ctx.reply( 'Вы действительно хотите удалить выбранный товар', Markup.keyboard( [ [ 'Подтвердить' ], [ 'Отменить' ] ] ).resize() )

} )

// confirmation

const confirmHandler = new Composer<ContextE>()

confirmHandler.hears( 'Отменить', ctx => ctx.scene.reenter() )

confirmHandler.hears( 'Подтвердить', async ctx => {

	try {

		await db( 'goods' )
			.delete()
			.where( 'good_id', ctx.session.goodId )

		await ctx.reply( `Товар был успешно удален` )

	} catch ( e ) {

		console.log( 'delete good error', e )
		await ctx.reply( `Не удалось удалить товар, попробуйте позже` )

	}

	return ctx.scene.enter( 'settings' )

} )

// scene

const goodsDelete = new Scenes.WizardScene(
	'goods/delete',

	async ( ctx ) => {

		const cities = await db( 'cities' )
			.select( 'name' )

		if ( !cities )
			return ctx.reply( 'Нет товаров доступных для удаления' ), ctx.scene.enter( 'settings' )

		const keyboard = cities.map( c => c.name )

		keyboard.push( 'Отменить' )

		await ctx.wizard.next()
		return ctx.reply( 'Выберите город для добавления товара', Markup.keyboard( keyboard, { columns : 3 } ).resize() )

	},

	selectCityHandler,
	selectGoodHandler,
	confirmHandler
)

export default goodsDelete