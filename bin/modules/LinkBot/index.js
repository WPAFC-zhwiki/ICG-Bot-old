const { transport } = require( '../../util/init.js' ),
	{ dcBot, tgBot, ircBot } = require( '../../util/bots.js' ),
	irccolor = require( 'irc-colors' ),
	parser = require( './parselink' );
let logs = {};

dcBot.on( 'message', function ( message ) {
	logs = {
		clent: 'Discord',
		from: message.author.tag + '(' + message.author.id + ')',
		channelid: message.channel.id,
		messageid: message.id,
		message: message.content.replace( /\n/g, '\\n' ),
		bot: message.author.bot
	};

	parselink( message.content, 'discord', message.channel.id, logs, function ( msg ) {
		message.channel.send( msg );
	} );
} );

tgBot.on( 'message', function ( ctx ) {
	if ( typeof ctx.message.text !== 'string' && typeof ctx.message.caption !== 'string' ) {
		return;
	}
	logs = {
		client: 'Telegram',
		from: ctx.from.id,
		chatid: ctx.chat.id,
		messageid: ctx.message.message_id,
		message: ( ctx.message.text || ctx.message.caption + ' (caption)' ).replace( /\n/g, '\\n' ),
		bot: ctx.from.is_bot
	};

	parselink( ( ctx.message.text || ctx.message.caption + ' (caption)' ), 'telegram', ctx.chat.id, logs, function ( msg ) {
		ctx.reply( msg, {
			// eslint-disable-next-line camelcase
			reply_to_message_id: ctx.message.message_id
		} );
	} );
} );

ircBot.on( 'message', function ( from, to, text ) {
	if ( from === ircBot.nick ) {
		return;
	}

	let plainText = irccolor.stripColorsAndStyle( text );

	logs = {
		client: 'IRC',
		from: from,
		channel: to,
		message: plainText
	};

	parselink( plainText, 'irc', to, logs, function ( msg ) {
		ircBot.say( to, msg );
	} );
} );

// eslint-disable-next-line no-shadow
function parselink( text = '', client = '', chat = '', logs = {}, reply = function ( msg = '' ) {
	// eslint-disable-next-line no-void
	return void msg;
} ) {
	let result = parser( text, logs );

	if ( !result ) {
		return;
	}

	reply( result );

	if ( transport[ `${ client }/${ chat }` ] ) {
		for ( let key in transport[ `${ client }/${ chat }` ] ) {
			let tarnsid = transport[ `${ client }/${ chat }` ][ key ];
			if ( !tarnsid ) {
				continue;
			}
			switch ( key ) {
				case 'telegram':
					tgBot.telegram.sendMessage( tarnsid, result );
					break;
				case 'discord':
					if ( dcBot.channels.cache.has( tarnsid ) ) {
						dcBot.channels.cache.get( tarnsid ).send( result );
					} else {
						dcBot.channels.fetch( tarnsid, true ).then( function ( channel ) {
							channel.send( result );
						} );
					}
					break;
				case 'irc':
					ircBot.say( tarnsid, result );
					break;
			}
		}
	}
}
