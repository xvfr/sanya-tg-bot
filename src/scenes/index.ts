import { Scenes } from 'telegraf'

import buyMenu from './buy-menu'

// control
import settings from './settings'
import citiesCreate from './cities/create'
import citiesEdit from './cities/edit'
import citiesDelete from './cities/delete'
import goodsCreate from './goods/create'
import goodsEdit from './goods/edit'
import goodsDelete from './goods/delete'

const scenes = [
	buyMenu,
	settings,

	// control
	citiesCreate,
	citiesEdit,
	citiesDelete,

	goodsCreate,
	goodsEdit,
	goodsDelete
]

scenes.forEach( s => s.id === 'settings' || s.settings( ctx => ctx.scene.enter( 'settings' ) ) )
scenes.forEach( s => s.id === 'buy-menu' || s.start( ctx => ctx.scene.enter( 'buy-menu' ) ) )

export default new Scenes.Stage<any>( scenes )