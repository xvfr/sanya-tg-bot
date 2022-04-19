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

	ctx.session.cityId = cityId

	await ctx.wizard.next()
	return ctx.reply( 'Введите название для товара', Markup.keyboard( [ 'Назад' ] ).resize() )

} )

// select new name

const selectNameHandler = new Composer<ContextE>()

selectNameHandler.hears( 'Назад', ctx => ctx.scene.reenter() )

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

		const [ goodId ] = await db( 'goods' )
			.insert( {
				city_id : ctx.session.cityId,
				name : goodName,
				price : 0
			} )
			.returning( 'good_id' )

		ctx.session.goodId = goodId

		await ctx.wizard.next()
		return ctx.reply( 'Введите цену товара' )

	} catch ( e ) {

		console.log( 'create good error', e )
		await ctx.reply( `Не удалось добавить товар, попробуйте позже` )

	}

	return ctx.scene.enter( 'settings' )

} )

// select price

const selectPriceHandler = new Composer<ContextE>()

selectPriceHandler.hears( 'Назад', ctx => ctx.scene.reenter() )

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
			.where( 'city_id', ctx.session.cityId )
			.where( 'good_id', ctx.session.goodId )

		await ctx.reply( 'Товар был успешно добавлен' )

	} catch ( e ) {

		console.log( 'create good error', e )
		await ctx.reply( `Не удалось добавить товар, попробуйте позже` )

	}

	return ctx.scene.enter( 'settings' )

} )

// scene

const goodsCreate = new Scenes.WizardScene(
	'goods/create',

	async ( ctx ) => {

		const cities = await db( 'cities' )
			.select( 'name' )

		if ( !cities )
			return ctx.reply( 'Необходимо добавить хотя бы один город для добавления товаров' ), ctx.scene.enter( 'settings' )

		const keyboard = cities.map( c => c.name )

		keyboard.push( 'Отменить' )

		await ctx.wizard.next()
		return ctx.reply( 'Выберите город для добавления товара', Markup.keyboard( keyboard, { columns : 3 } ).resize() )

	},

	selectCityHandler,
	selectNameHandler,
	selectPriceHandler
)

export default goodsCreate