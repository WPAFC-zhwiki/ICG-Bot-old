const { dcBot, tgBot } = require( './util/bots' );
const fs = require( 'fs' ),
	{ DCREVCHN, TGREVGRP, bindCommand, bindEvent, loadModules } = require( './util/init.js' );

console.log( '\x1b[34m[BOT]\x1b[0m Loading commands:' );

const commandFiles = fs
	.readdirSync( './commands' )
	.filter( ( file ) => file.endsWith( '.js' ) );

for ( const file of commandFiles ) {
	const command = require( `./commands/${ file }` );
	bindCommand( command );
}

console.log( '\x1b[34m[BOT]\x1b[0m Loading events:' );

const eventFiles = fs
	.readdirSync( './events' )
	.filter( ( file ) => file.endsWith( '.js' ) );

for ( const file of eventFiles ) {
	const event = require( `./events/${ file }` );
	bindEvent( event );
}

const modulesDirs = fs
	.readdirSync( './modules' );

for ( const dir of modulesDirs ) {
	loadModules( dir );
}

dcBot.once( 'ready', async () => {
	tgBot.on( 'message', ( msg ) => {
		let chatId = msg.chat.id;

		if ( /ping/i.test( msg.text ) ) {
			tgBot.telegram.sendMessage( chatId, 'Pong!' );
		}
		let fwdchan;
		if ( msg.chat.id === TGREVGRP ) {
			fwdchan = DCREVCHN;
		}
		if ( !fwdchan ) {
			return;
		}
	} );

	tgBot.on( 'polling_error', console.log );
} );

dcBot.once( 'ready', async () => {
	dcBot.user.setPresence( {
		// activity: { name: "you", type: "WATCHING" },
		status: 'online'
	} );
} );
