const { Telegraf } = require( 'telegraf' ),
	{ Client: Discord, Intents: DiscordIntents, Collection: DiscordCollection } = require( 'discord.js' ),
	{ Client: IRC } = require( 'irc-upd' ),
	{ mwn } = require( 'mwn' ),
	credentials = require( './credentials.json' ),
	config = require( './config.json' );

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
		autoConnect: false
	} ),
	mwbot = new mwn( credentials.mwn );

dcBot.login( credentials.DiscordToken ).catch( function ( e ) {
	console.log( '\x1b[31m[E] [Discord]\x1b[0m Error:', e );
} );

dcBot.once( 'ready', function () {
	console.log( `\x1b[32m[S] [Discord]\x1b[0m login as ${ dcBot.user.username }#${ dcBot.user.tag } (${ dcBot.user.id })` );
} );

dcBot.commands = new DiscordCollection();

tgBot.telegram.getMe().then( function ( me ) {
	console.log( `\x1b[32m[S] [Telegram]\x1b[0m login as ${ me.first_name }${ me.last_name || '' }@${ me.username } (${ me.id })` );
} ).catch( function ( e ) {
	console.log( '\x1b[31m[E] [Telegram]\x1b[0m Telegraf.telegram.getMe() fail', e );
	return null;
} );

tgBot.launch().catch( function ( e ) {
	console.log( '\x1b[31m[E] [Telegram]\x1b[0m Error:', e );
} );

if ( credentials.mwn.OAuthCredentials ) {
	mwbot.getTokensAndSiteInfo();
} else {
	mwbot.login();
}

const path = require( 'path' ),
	window = new ( require( 'jsdom' ).JSDOM )( '' ).window,
	jQuery = require( 'jquery' )( window, true );

function tgCommand( command ) {
	tgBot.telegram.setMyCommands( [ {
		command: command.name,
		description: command.description
	} ] );
	tgBot.command( command.name, function ( ctx ) {
		let args = ctx.message.text.split( ' ' );
		args.shift();
		command.run( { dcBot, tgBot }, args,
			function ( { tMsg, dMsg }, iserror ) {
				if ( iserror ) {
					ctx.reply( tMsg, {
						// eslint-disable-next-line camelcase
						parse_mode: 'Markdown',
						// eslint-disable-next-line camelcase
						reply_to_message_id: ctx.message
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

				if ( ctx.chat.id === config.TGREVGRP ) {
					dcBot.channels.cache.get( config.DCREVCHN ).send( dMsg );
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
			} );
	} );
}

function bindCommand( command ) {
	console.log( `\x1b[33m[Command]\x1b[0m Load command ${ command.name }` );
	dcCommand( command );
	tgCommand( command );
}

function bindEvent( event ) {
	console.log( `\x1b[33m[Event]\x1b[0m Load event ${ event.name }` );
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
	ircBot,
	mwbot,
	DCREVCHN: config.DCREVCHN,
	TGREVGRP: config.TGREVGRP,
	IRCCHN: config.IRCCHN,
	bindCommand,
	bindEvent,
	loadModules,
	jQuery,
	$: jQuery
};
