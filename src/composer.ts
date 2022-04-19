import { Composer, Context, Scenes, session } from 'telegraf'
import stage from './scenes'
import actions from './actions'

interface SessionE extends Scenes.WizardSession {
	cityId? : number,
	goodId? : number
}

export interface ContextE extends Context {
	session : SessionE
	scene : Scenes.SceneContextScene<ContextE, Scenes.WizardSessionData>
	wizard : Scenes.WizardContextWizard<ContextE>
}

const composer = new Composer<ContextE>()

composer.use( actions )
composer.use( session() )
composer.use( stage.middleware() )

composer.start( ctx => ctx.scene.enter( 'buy-menu' ) )
composer.settings( ctx => ctx.scene.enter( 'settings' ) )

// composer.on( 'message', async ctx => {
// 	// @ts-ignore
// 	console.log( ctx.message.photo )
//
// 	// ctx.replyWithPhoto( {
// 	// 	url : 'https://images.hdqwalls.com/download/artist-workspace-ei-2560x1080.jpg'
// 	// } )
//
// 	ctx.replyWithPhoto( 'AgACAgIAAxkBAAIJo2JfMv1eiVwS3TWWh-YqoGYooxzMAAInvDEb2nL5ShbFhrlyLkGlAQADAgADeAADJAQ' )
//
// } )

composer.on( 'message', async ctx => {
	return ctx.reply( 'Неизвестная команда!\nИспользуйте /start чтобы вернуться в меню' )
} )

export default composer