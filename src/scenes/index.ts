import { Scenes } from 'telegraf'

import buyMenu from './buy-menu'

const scenes = [
	buyMenu
]

const stage = new Scenes.Stage<any>( scenes, {
	// default : 'buy-menu'
} )

export default stage