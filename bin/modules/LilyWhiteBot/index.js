/**
 * LilyWhiteBot
 * https://github.com/mrhso/LilyWhiteBot
 *
 * @author      vjudge1, Ishisashi
 * @description
 */
const { Context, Message } = require( './handlers/Context.js' );
const { loadConfig } = require( './util.js' );

const allHandlers = new Map( [
	[ 'IRC', 'IRCMessageHandler' ],
	[ 'Telegram', 'TelegramMessageHandler' ],
	[ 'Discord', 'DiscordMessageHandler' ]
] );

// 所有擴充套件包括傳話機器人都只與該物件打交道
const pluginManager = {
	handlers: new Map(),
	handlerClasses: new Map(),
	config: {},
	global: {
		Context,
		Message
	},
	plugins: {}
};

process.on( 'unhandledRejection', ( reason, promise ) => {
	promise.catch( ( e ) => {
		console.error( 'Unhandled Rejection: ', e );
	} );
} );

process.on( 'uncaughtException', ( err, origin ) => {
	console.error( 'Uncaught exception:', err );
} );

process.on( 'rejectionHandled', ( promise ) => {
	// 忽略
} );

const config = loadConfig( 'config' );

// 启动各机器人
let enabledClients = [];
for ( let type of allHandlers.keys() ) {
	if ( config[ type ] && !config[ type ].disabled ) {
		enabledClients.push( type );
	}
}

console.log( `\x1b[36m[Modules] [LilyWhiteBot]\x1b[0m Enabled clients: ${ enabledClients.join( ', ' ) }` );

for ( let client of enabledClients ) {
	const options = config[ client ];
	const Handler = require( `./handlers/${ allHandlers.get( client ) }.js` );
	const handler = new Handler( options );
	handler.start();

	pluginManager.handlers.set( client, handler );
	pluginManager.handlerClasses.set( client, {
		object: Handler,
		options: options
	} );
}

/**
 * 載入擴充套件
 */
console.info( '\x1b[36m[Modules] [LilyWhiteBot]\x1b[0m Loading plugins...' );
pluginManager.config = config;
for ( let plugin of config.plugins ) {
	try {
		console.info( `\x1b[36m[Modules] [LilyWhiteBot]\x1b[0m Loading plugin: ${ plugin }` );
		let p = require( `./plugins/${ plugin }.js` )( pluginManager, config[ plugin ] || {} );
		if ( p ) {
			pluginManager.plugins[ plugin ] = p;
		} else {
			pluginManager.plugins[ plugin ] = true;
		}
	} catch ( ex ) {
		console.error( `\x1b[36m[Modules] [LilyWhiteBot]\x1b[0m Error while loading plugin ${ plugin }: `, ex );
	}
}
if ( !config.plugins || config.plugins.length === 0 ) {
	console.info( '\x1b[36m[Modules] [LilyWhiteBot]\x1b[0m No plugins loaded.' );
}
