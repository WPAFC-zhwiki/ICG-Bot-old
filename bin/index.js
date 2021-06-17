const { dcBot, tgBot } = require( './util/bots' ),
	{ bindCommand, bindEvent, loadModules } = require( './util/init.js' ),
	fs = require( 'fs' );

console.log( '\x1b[34m[BOT]\x1b[0m Loading commands:' );

const commandFiles = fs
	.readdirSync( './commands' )
	.filter( ( file ) => file.endsWith( '.js' ) );

const commandList = [];

for ( const file of commandFiles ) {
	const command = require( `./commands/${ file }` );
	bindCommand( command );
	commandList.push( {
		command: command.name,
		description: command.description
	} );
}

tgBot.telegram.setMyCommands( commandList );

const modulesDirs = fs
	.readdirSync( './modules' );

for ( const path of modulesDirs ) {
	loadModules( path );
}

console.log( '\x1b[34m[BOT]\x1b[0m Loading events:' );

const eventFiles = fs
	.readdirSync( './events' )
	.filter( ( file ) => file.endsWith( '.js' ) );

for ( const file of eventFiles ) {
	const event = require( `./events/${ file }` );
	bindEvent( event );
}

dcBot.once( 'ready', async () => {
	dcBot.user.setPresence( {
		// activity: { name: "you", type: "WATCHING" },
		status: 'online'
	} );
} );
