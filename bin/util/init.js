const { Telegraf } = require( 'telegraf' ),
	{ Client: Discord, Intents: DiscordIntents } = require( 'discord.js' ),
	{ Client: IRC } = require( 'irc-upd' ),
	{ mwn } = require( 'mwn' ),
	credentials = require( './credentials.json' ),
	config = require( './config.json' ),
	transport = {};

const intents = new DiscordIntents();
intents.add(
	'GUILDS', 'GUILD_MEMBERS', 'GUILD_BANS', 'GUILD_EMOJIS', 'GUILD_WEBHOOKS', 'GUILD_INVITES',
	'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'GUILD_MESSAGE_TYPING', 'DIRECT_MESSAGES',
	'DIRECT_MESSAGE_REACTIONS', 'DIRECT_MESSAGE_TYPING'
);

Object.assign( credentials.mwn, {
	apiUrl: 'https://zh.wikipedia.org/w/api.php',
	defaultParams: {
		assert: 'user'
	}
} );

const dcBot = new Discord( { intents } ),
	tgBot = new Telegraf( credentials.TelegramToken ),
	ircBot = new IRC( 'irc.libera.chat', credentials.IRC.nick, {
		userName: credentials.IRC.userName,
		realName: 'Sunny00217Bot',
		port: 6697,
		autoRejoin: true,
		secure: true,
		floodProtection: true,
		floodProtectionDelay: 300,
		sasl: true,
		password: credentials.IRC.password,
		encoding: 'UTF-8',
		autoConnect: false,
		channels: config.IRCChannels
	} ),
	mwbot = new mwn( credentials.mwn );

dcBot.login( credentials.DiscordToken ).catch( function ( e ) {
	console.log( '\x1b[31m[ERR] [Discord]\x1b[0m Error:', e );
} );

dcBot.once( 'ready', function () {
	console.log( `\x1b[32m[INIT] [Discord]\x1b[0m login as ${ dcBot.user.username }#${ dcBot.user.tag } (${ dcBot.user.id })` );
} );

dcBot.on( 'error', function ( err ) {
	console.log( '\x1b[32m[ERR] [Discord]\x1b[0m', err );
} );

tgBot.telegram.getMe().then( function ( me ) {
	console.log( `\x1b[32m[INIT] [Telegram]\x1b[0m login as ${ me.first_name }${ me.last_name || '' }@${ me.username } (${ me.id })` );
} ).catch( function ( e ) {
	console.log( '\x1b[31m[INIT] [Telegram]\x1b[0m Telegraf.telegram.getMe() fail', e );
	return null;
} );

tgBot.catch( function ( err ) {
	console.log( '\x1b[31m[ERR] [Telegram]\x1b[0m', err );
} );

tgBot.launch().catch( function ( e ) {
	console.log( '\x1b[31m[ERR] [Telegram]\x1b[0m Error:', e );
} );

ircBot.connect();

ircBot.on( 'registered', () => {
	ircBot.whois( credentials.IRC.nick, function ( data ) {
		try {
			console.log( `\x1b[32m[INIT] [IRC]\x1b[0m login as ${ data.nick }!${ data.user }@${ data.host } (${ data.account })` );
		} catch ( e ) {
			console.log( '\x1b[31m[ERR] [IRC]\x1b[0m Error:', data, e );
		}
	} );
} );

ircBot.on( 'error', ( message ) => {
	console.log( `\x1b[31m[ERR] [IRC]\x1b[0m Error: ${ message.command } (${ ( message.args || [] ).join( ' ' ) })` );
} );

if ( credentials.mwn.OAuthCredentials ) {
	mwbot.getTokensAndSiteInfo();
} else {
	mwbot.login();
}

function parseTransportUID( u ) {
	let client = null, id = null, uid = null;
	if ( u ) {
		let s = u.toString();
		let i = s.indexOf( '/' );

		if ( i !== -1 ) {
			client = s.substr( 0, i ).toLowerCase();

			id = s.substr( i + 1 );
			uid = `${ client.toLowerCase() }/${ id }`;
		}
	}
	return { client, id, uid };
}

config.transport.forEach( function ( group ) {
	for ( let c1 of group ) {
		let client1 = parseTransportUID( c1 ).uid;

		if ( client1 ) {
			for ( let c2 of group ) {
				let client2 = parseTransportUID( c2 );
				if ( client1 === client2.uid ) {
					continue;
				}
				if ( !transport[ client1 ] ) {
					transport[ client1 ] = {
						discord: null,
						telegram: null,
						irc: null
					};
				}

				transport[ client1 ][ client2.client ] = client2.id;
			}
		}
	}
} );

/**
 * @typedef {import('telegraf').Context} ctx
 */

/**
 * @type {((ctx: ctx)=>void)[]}
 */
const tgOnMessageFunc = [];

/**
 * @param {(ctx: ctx)=>void} func
 */
function tgOnMessage( func ) {
	tgOnMessageFunc.push( func );
}

tgBot.on( 'message', function ( ctx, next ) {
	tgOnMessageFunc.forEach( function ( func ) {
		func( ctx );
	} );
	return next();
} );

const path = require( 'path' ),
	window = new ( require( 'jsdom' ).JSDOM )( '' ).window,
	jQuery = require( 'jquery' )( window, true );

function tgCommand( command ) {
	const regex = /^\/([^@\s]+)@?(?:(\S+)|)\s?([\s\S]+)?$/i;
	tgOnMessage( function ( ctx ) {
		const messageText = ctx.message.text;
		const parts = regex.exec( messageText );
		if ( !parts || parts[ 1 ] !== command.name ) {
			return;
		}
		console.log( `\x1b[38m[COMMAND]\x1b[0m ${ parts[ 1 ] } fire` );
		let args = !parts[ 3 ] ? [] : parts[ 3 ].split( /\s+/ ).filter( ( arg ) => arg.length );
		command.run( { dcBot, tgBot }, args,
			function ( { tMsg, dMsg }, iserror ) {
				if ( iserror ) {
					ctx.reply( tMsg, {
						// eslint-disable-next-line camelcase
						parse_mode: 'Markdown',
						// eslint-disable-next-line camelcase
						reply_to_message_id: ctx.message.message_id,
						// eslint-disable-next-line camelcase
						disable_web_page_preview: true
					} ).catch( function () {
						ctx.reply( tMsg );
					} );
					return;
				}

				ctx.reply( tMsg, {
					// eslint-disable-next-line camelcase
					parse_mode: 'Markdown',
					// eslint-disable-next-line camelcase
					disable_web_page_preview: true
				} );

				if ( transport[ `telegram/${ ctx.chat.id }` ] ) {
					if ( transport[ `telegram/${ ctx.chat.id }` ].discord ) {
						dcBot.channels.cache.get( transport[ `telegram/${ ctx.chat.id }` ].discord ).send( dMsg );
					}
				}
			} );
	} );
}

function dcCommand( command ) {
	dcBot.on( 'message', function ( message ) {
		if ( typeof message.content !== 'string' || !message.content.startsWith( `/${ command.name }` ) ) {
			return;
		}
		let args = message.content.split( ' ' );
		args.shift();
		command.run( { dcBot, tgBot }, args,
			function ( { tMsg, dMsg }, iserror ) {
				if ( iserror ) {
					message.channel.send( dMsg );
					return;
				}
				message.channel.send( dMsg );
				if ( message.channel.id === config.DCREVCHN ) {
					tgBot.telegram.sendMessage( config.TGREVGRP, tMsg, {
						// eslint-disable-next-line camelcase
						parse_mode: 'Markdown',
						// eslint-disable-next-line camelcase
						disable_web_page_preview: true
					} );
				}

				if ( transport[ `discord/${ message.channel.id }` ] ) {
					if ( transport[ `discord/${ message.channel.id }` ].telegram ) {
						tgBot.telegram.sendMessage( transport[ `discord/${ message.channel.id }` ].telegram, tMsg, {
							// eslint-disable-next-line camelcase
							parse_mode: 'Markdown',
							// eslint-disable-next-line camelcase
							disable_web_page_preview: true
						} );
					}
				}
			} );
	} );
}

function bindCommand( command ) {
	console.log( `\x1b[33m[COMMAND]\x1b[0m Load command ${ command.name }` );
	dcCommand( command );
	tgCommand( command );
}

function bindEvent( event ) {
	console.log( `\x1b[33m[EVENT]\x1b[0m Load event ${ event.name }` );
	event.fire( function ( { tMsg, dMsg } ) {
		dcBot.channels.cache.get( config.DCREVCHN ).send( dMsg );
		tgBot.telegram.sendMessage( config.TGREVGRP, tMsg, {
			// eslint-disable-next-line camelcase
			parse_mode: 'Markdown',
			// eslint-disable-next-line camelcase
			disable_web_page_preview: true
		} );
	} );
}

function loadModules( dir ) {
	console.log( `\x1b[33m[Modules]\x1b[0m Load module ${ dir }` );
	const index = path.join( __dirname, '../modules', dir, 'index.js' );
	try {
		require( index );
	} catch ( e ) {
		console.log( `\x1b[31m[E] [Modules]\x1b[0m Can't load module ${ dir } from ${ index }`, e );
	}
}

module.exports = {
	dcBot,
	tgBot,
	tgOnMessage,
	ircBot,
	mwbot,
	DCREVCHN: config.DCREVCHN,
	TGREVGRP: config.TGREVGRP,
	IRCCHN: config.IRCCHN,
	transport,
	bindCommand,
	bindEvent,
	loadModules,
	jQuery,
	$: jQuery
};
