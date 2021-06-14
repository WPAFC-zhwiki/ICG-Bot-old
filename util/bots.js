const { Telegraf } = require( 'telegraf' ),
	{ Client: Discord, Intents: DiscordIntents, Collection: DiscordCollection } = require( 'discord.js' ),
	credentials = require( './credentials.json' ),
	config = require( './config.json' );

const intents = new DiscordIntents();
intents.add(
	'GUILDS', 'GUILD_MEMBERS', 'GUILD_BANS', 'GUILD_EMOJIS', 'GUILD_WEBHOOKS', 'GUILD_INVITES',
	'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'GUILD_MESSAGE_TYPING', 'DIRECT_MESSAGES',
	'DIRECT_MESSAGE_REACTIONS', 'DIRECT_MESSAGE_TYPING'
);

const dcBot = new Discord( { intents } ),
	tgBot = new Telegraf( credentials.TelegramToken );

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

module.exports = {
	dcBot,
	tgBot,
	DCREVCHN: config.DCREVCHN,
	TGREVGRP: config.TGREVGRP,
	IRCCHN: config.IRCCHN
};
