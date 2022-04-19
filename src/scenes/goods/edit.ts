import { Composer, Markup, Scenes } from 'telegraf'
import db from '../../db'
import { ContextE } from '../../composer'

// select city for edit

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
	return ctx.reply( 'Выберите товар для редактирования', Markup.keyboard( keyboard, { columns : 3 } ).resize() )

} )


// select good for edit

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
	return ctx.reply( 'Введите новое название для товара', Markup.keyboard( [ [ 'Назад' ], [ 'Оставить текущее' ] ] ).resize() )

} )

// select new name

const selectNameHandler = new Composer<ContextE>()

selectNameHandler.hears( 'Назад', ctx => ctx.scene.reenter() )
selectNameHandler.hears( 'Оставить текущее', async ctx => {
	await ctx.wizard.next()
	return ctx.reply( 'Введите цену товара' )
} )

selectNameHandler.hears( /.+/, async ctx => {

	const
		goodName = ctx.match[ 0 ]

	if ( !String( goodName ) || goodName.length > 75 )
		return ctx.reply( 'Товар должен быть строкой и не должен содержать более 75 символов' )

	const exist = await db( 'goods' )
		.first( 'city_id' )
		.where( 'city_id', ctx.session.cityId )
		.where( 'name', goodName )

	if ( exist )
		return ctx.reply( 'Товар с таким названием уже существует!' )

	try {

		await db( 'goods' )
			.update( {
				name: goodName
			})
			.where( 'good_id', ctx.session.goodId )

		await ctx.wizard.next()
		return ctx.reply( 'Введите цену товара', Markup.keyboard( [ 'Оставить текущую' ] ).resize() )

	} catch ( e ) {

		console.log( 'edit good error', e )
		await ctx.reply( `Не удалось отредактировать товар, попробуйте позже` )

	}

	return ctx.scene.enter( 'settings' )

} )

// select price

const selectPriceHandler = new Composer<ContextE>()

selectPriceHandler.hears( 'Оставить текущую', async ( ctx ) => {
	ctx.reply( 'Товар был успешно отредактирован' ), ctx.scene.enter( 'settings' )
} )

selectPriceHandler.hears( /.+/, async ctx => {

	const
		price = Number( ctx.match[ 0 ].replace( ',', '.' ) )

	if ( !price || isNaN( price ) || price <= 0 )
		return ctx.reply( 'Цена товара должна быть положительным числом' )

	try {

		await db( 'goods' )
			.update( {
				price
			} )
			.where( 'good_id', ctx.session.goodId )

		await ctx.reply( 'Товар был успешно отредактирован' )

	} catch ( e ) {

		console.log( 'create good error', e )
		await ctx.reply( `Не удалось отредактировать товар, попробуйте позже` )

	}

	return ctx.scene.enter( 'settings' )

} )

// scene

const goodsEdit = new Scenes.WizardScene(
	'goods/edit',

	async ( ctx ) => {

		const cities = await db( 'cities' )
			.select( 'name' )

		if ( !cities )
			return ctx.reply( 'Необходимо добавить хотя бы один город для редактирования товаров' ), ctx.scene.enter( 'settings' )

		const keyboard = cities.map( c => c.name )

		keyboard.push( 'Отменить' )

		await ctx.wizard.next()
		return ctx.reply( 'Выберите город для редактирования товара', Markup.keyboard( keyboard, { columns : 3 } ).resize() )

	},

	selectCityHandler,
	selectGoodHandler,
	selectNameHandler,
	selectPriceHandler
)

export default goodsEdit