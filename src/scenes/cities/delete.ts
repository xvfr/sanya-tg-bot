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
	return ctx.reply( 'Вы действительно хотите удалить город?\nВместе с ним будут удалены и привязанные к нему товары',
		Markup.keyboard( [ [ 'Подтвердить', 'Отменить' ] ] ).resize() )

} )

// confirmation

const confirmHandler = new Composer<ContextE>()

confirmHandler.hears( 'Отменить', ctx => ctx.scene.reenter() )

confirmHandler.hears( 'Подтвердить', async ctx => {

	try {

		await db( 'cities' )
			.delete()
			.where( 'city_id', ctx.session.cityId )

		await ctx.reply( `Город был успешно удален` )

	} catch ( e ) {

		console.log( 'delete city error', e )
		await ctx.reply( `Не удалось удалить город, попробуйте позже` )

	}

	return ctx.scene.enter( 'settings' )

} )

// scene

const citiesDelete = new Scenes.WizardScene(
	'cities/delete',

	async ( ctx ) => {

		const cities = await db( 'cities' )
			.select( 'name' )

		if ( !cities )
			return ctx.reply( 'Нет доступных для редактирования городов' ), ctx.scene.enter( 'settings' )

		const keyboard = cities.map( c => c.name )

		keyboard.push( 'Отменить' )

		await ctx.wizard.next()
		return ctx.reply( 'Выберите город для удаления', Markup.keyboard( keyboard, { columns : 3 } ).resize() )

	},

	selectCityHandler,
	confirmHandler
)

export default citiesDelete