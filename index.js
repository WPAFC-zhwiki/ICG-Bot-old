const { dcBot, tgBot } = require( './util/bots' );
const fs = require( 'fs' ),
	{ DCREVCHN, TGREVGRP, bindCommand, bindEvent, loadModules } = require( './util/init.js' ),
	moment = require( 'moment' );

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
		let intLinks = ( msg.text || '' ).match( /\[\[(.*?)(?:\|.*?)?\]\]/g );
		let links = [];
		if ( intLinks ) {
			for ( let link of intLinks ) {
				let c = link.match( /\[\[(.*?)(?:\|.*?)?\]\]/ )[ 1 ];
				links.push( `https://zhwp.org/${ c }` );
			}
		}
		let tLinks = ( msg.text || '' ).match( /\{\{([^{}]*?)(?:\|[^}]*?)?\}\}(?!\})/g );
		if ( tLinks ) {
			for ( let link of tLinks ) {
				let c = link.match( /\{\{([^{}]*?)(?:\|[^}]*?)?\}\}(?!\})/ )[ 1 ];
				links.push( `https://zhwp.org/Template:${ c }` );
			}
		}

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
	console.log( `${ moment().utcOffset( 8 ).format( 'YYYY/MM/DD HH:mm:ss' ) } | ${ dcBot.user.username } is up!` );
	dcBot.allinvites = await dcBot.guilds.cache
		.get( '852562141864787998' )
		.fetchInvites();

	dcBot.user.setPresence( {
		// activity: { name: "you", type: "WATCHING" },
		status: 'online'
	} );
} );

dcBot.on( 'message', async ( message ) => {
	if ( message.author.bot ) {
		return;
	}
	let intLinks = message.content.match( /\[\[(.*?)(?:\|.*?)?\]\]/g );
	let links = [];
	if ( intLinks ) {
		for ( let link of intLinks ) {
			let c = link.match( /\[\[(.*?)(?:\|.*?)?\]\]/ )[ 1 ];
			links.push( `https://zhwp.org/${ c }` );
		}
	}
	let tLinks = message.content.match( /\{\{(.*?)(?:\|.*?)?\}\}/g );
	if ( tLinks ) {
		for ( let link of tLinks ) {
			let c = link.match( /\{\{(.*?)(?:\|.*?)?\}\}/ )[ 1 ];
			links.push( `https://zhwp.org/Template:${ c }` );
		}
	}

	// await fn.wait(500)
	// tgBot.sendMessage(fwdchan, )
} );
// setInterval(() => {
//   let alllogs = logs.all()
//   if (alllogs.length) {
//     alllogs.forEach((log) => {
//       fn.writeLogs(log.ID)
//     })
//     fn.addLog(
//       `MAIN`,
//       `Logs have been written for ${alllogs.map((log) => log.ID)}`
//     )
//   }
// }, 120000) //2 minutes
