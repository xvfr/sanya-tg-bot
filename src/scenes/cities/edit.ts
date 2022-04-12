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
	return ctx.reply( 'Введите новое название для города', Markup.keyboard( [ 'Назад' ] ).resize() )

} )

// select new name

const selectNameHandler = new Composer<ContextE>()

selectNameHandler.hears( 'Назад', ctx => ctx.scene.reenter() )

selectNameHandler.hears( /.+/, async ctx => {

	const
		cityName = ctx.match[ 0 ]

	if ( !String( cityName ) || cityName.length > 75 )
		return ctx.reply( 'Город должен быть строкой и не должен содержать более 75 символов' )

	const exists = await db( 'cities' )
		.first( 'city_id' )
		.where( 'name', cityName )

	if ( exists )
		return ctx.reply('Город с таким названием уже добавлен')

	try {

		await db( 'cities' )
			.update( 'name', cityName )
			.where( 'city_id', ctx.session.cityId )

		await ctx.reply( `Город ${ cityName } успешно отредактирован` )

	} catch ( e ) {

		console.log( 'edit city error', e )
		await ctx.reply( `Не удалось отредактировать город, возможно он был удален` )

	}

	return ctx.scene.enter( 'settings' )

} )

// scene

const citiesEdit = new Scenes.WizardScene(
	'cities/edit',

	async ( ctx ) => {

		const cities = await db( 'cities' )
			.select( 'name' )

		if ( !cities )
			return ctx.reply( 'Нет доступных для редактирования городов' ), ctx.scene.enter( 'settings' )

		const keyboard = cities.map( c => c.name )

		keyboard.push( 'Отменить' )

		await ctx.wizard.next()
		return ctx.reply( 'Выберите город для редактирования', Markup.keyboard( keyboard, { columns : 3 } ).resize() )

	},

	selectCityHandler,
	selectNameHandler
)

export default citiesEdit