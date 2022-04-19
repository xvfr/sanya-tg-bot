import { Composer, Markup, Scenes } from 'telegraf'
import { ContextE } from '../composer'

const selectTypeHandler = new Composer<ContextE>()

selectTypeHandler.hears( 'Назад', ctx => ctx.scene.enter( 'buy-menu' ) )

// cities
selectTypeHandler.hears( 'Добавить город', ctx => ctx.scene.enter( 'cities/create' ) )
selectTypeHandler.hears( 'Редактировать город', ctx => ctx.scene.enter( 'cities/edit' ) )
selectTypeHandler.hears( 'Удалить город', ctx => ctx.scene.enter( 'cities/delete' ) )

// goods
selectTypeHandler.hears( 'Добавить товар', ctx => ctx.scene.enter( 'goods/create' ) )
selectTypeHandler.hears( 'Редактировать товар', ctx => ctx.scene.enter( 'goods/edit' ) )
selectTypeHandler.hears( 'Удалить товар', ctx => ctx.scene.enter( 'goods/delete' ) )

const settings = new Scenes.WizardScene(
	'settings',

	async ( ctx ) => {

		await ctx.wizard.next()

		return ctx.reply( 'Выберите настройку', Markup.keyboard( [
			[ 'Добавить город', 'Редактировать город', 'Удалить город' ],
			[ 'Добавить товар', 'Редактировать товар', 'Удалить товар' ],
			[ 'Добавить картинку' ],
			[ 'Назад' ]
		] ) )

	},

	selectTypeHandler
)

settings.start( ctx => ctx.scene.enter( 'buy-menu' ) )

export default settings