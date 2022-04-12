import { Composer, Markup, Scenes } from 'telegraf'
import { ContextE } from '../../composer'
import db from '../../db'

const selectNameHandler = new Composer<ContextE>()

selectNameHandler.hears( 'Отменить', ctx => ctx.scene.enter( 'settings' ) )

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
			.insert( {
				name : cityName
			} )

		await ctx.reply( `Город ${ cityName } успешно добавлен` )

	} catch ( e ) {

		console.log( 'add city error', e )
		await ctx.reply( `Не удалось добавить город, возможно он уже добавлен` )

	}

	return ctx.scene.enter( 'settings' )

} )

const citiesCreate = new Scenes.WizardScene(
	'cities/create',

	async ( ctx ) => {

		await ctx.wizard.next()
		return ctx.reply( 'Введите название нового города', Markup.keyboard( [ 'Отменить' ] ).resize() )

	},

	selectNameHandler
)

export default citiesCreate