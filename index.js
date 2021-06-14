const { dcBot, tgBot, DCREVCHN, TGREVGRP } = require( './util/bots' );
const fs = require( 'fs' ),
	{ bindCommand } = require( './modules/command.js' ),
	{ bindEvent } = require( './modules/event.js' ),
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
			tgBot.sendMessage( chatId, 'Pong!' );
		}
		let fwdchan;
		if ( msg.chat.id === TGREVGRP ) {
			fwdchan = DCREVCHN;
		}
		if ( !fwdchan ) {
			return;
		}

		if ( /^\(NOFWD\)/.test( msg.text ) ) {
			return;
		}
		if ( links.length ) {
			tgBot.sendMessage( chatId, links.join( '\n' ) );
		}
		dcBot.channels.cache.get( fwdchan ).send(
			`[T - ${ msg.from.username }] ${ msg.text || ( msg.sticker ? `[Sticker] ${ msg.sticker.emoji }` : msg.photo ? '[IMAGE]' : msg.document ? '[DOCUMENT]' : msg.audio ? '[AUDIO]' : msg.video ? '[VIDEO]' : '' ) }${ links.length ? '\n' + links.join( '\n' ) : '' }`
		);

		// ircclient.say(IRCCHN,
		//   `[T - ${msg.from.username}] ${msg.text || (msg.sticker ? `[Sticker] ${msg.sticker.emoji}` : msg.photo ? `[IMAGE]` : msg.document ? `[DOCUMENT]` : msg.audio ? `[AUDIO]` : msg.video ? `[VIDEO]` : "")}${links.length ? "\n" + links.join("\n") : ''}`
		// );
	} );

	tgBot.on( 'polling_error', console.log );
} );

const token = process.env.DISCORD_BOT_TOKEN;
// , tokenT = process.env.TELEGRAM_BOT_TOKEN

/* --- ALL GLOBAL CONSTANTS & FUNCTIONS --- */

dcBot.login( token ).then( () => {
	console.log( 'AFC helper bot has logged in.' );
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

	let fwdchan;
	if ( message.channel.id === DCREVCHN ) {
		fwdchan = TGREVGRP;
	}
	if ( !fwdchan ) {
		return;
	}

	tgBot.sendMessage( fwdchan, `[D - ${ message.author.tag }] ${ message.content }${
		links.length ? '\n' + links.join( '\n' ) : ''
	}` );
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
