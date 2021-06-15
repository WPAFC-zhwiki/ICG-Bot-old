const { dcBot, tgBot, DCREVCHN, TGREVGRP } = require( '../util/bots' );

/**
 * @typedef {import('./command').reply} reply
 * @typedef {import('./command').command} command
 */

/**
 * @param {command} command
 */
function tgCommand( command ) {
	tgBot.telegram.setMyCommands( [ {
		command: command.name,
		description: command.description
	} ] );
	tgBot.command( command.name, function ( ctx ) {
		let args = ctx.message.text.split( ' ' );
		args.shift();
		command.run( { dcBot, tgBot }, args,
			/**
			 * @type {reply}
			 */
			async function ( { tMsg, dMsg }, iserror, eMsg ) {
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

				let m = await ctx.reply( tMsg, {
					// eslint-disable-next-line camelcase
					parse_mode: 'Markdown',
					// eslint-disable-next-line camelcase
					disable_web_page_preview: true
				} );

				if ( ctx.chat.id === TGREVGRP ) {
					dcBot.channels.cache.get( DCREVCHN ).send( dMsg );
				}

				return m
			} );
	} );
}

/**
 * @param {command} command
 */
function dcCommand( command ) {
	dcBot.on( 'message', function ( message ) {
		if ( typeof message.content !== 'string' || !message.content.startsWith( `/${ command.name }` ) ) {
			return;
		}
		let args = message.content.split( ' ' );
		args.shift();
		command.run( { dcBot, tgBot }, args,
			/**
			 * @type {reply}
			 */
			async function ( { tMsg, dMsg }, iserror, eMsg ) {
				if ( iserror ) {
					message.channel.send( dMsg );
					return;
				}
				let m = await message.channel.send( dMsg );
				if ( message.channel.id === DCREVCHN ) {
					tgBot.telegram.sendMessage( TGREVGRP, tMsg, {
						// eslint-disable-next-line camelcase
						parse_mode: 'Markdown',
						// eslint-disable-next-line camelcase
						disable_web_page_preview: true
					} );
				}
				return m
			} );
	} );
}

/**
 * @param {command} command
 */
function bindCommand( command ) {
	console.log( `\x1b[33m[Command]\x1b[0m Load plugin ${ command.name }` );
	dcCommand( command );
	tgCommand( command );
}

module.exports = {
	tgCommand,
	dcCommand,
	bindCommand
};
