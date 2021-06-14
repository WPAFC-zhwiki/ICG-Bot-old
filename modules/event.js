const { dcBot, tgBot, DCREVCHN, TGREVGRP } = require( '../util/bots' );

function bindEvent( event ) {
	console.log( `\x1b[33m[Event]\x1b[0m Load plugin ${ event.name }` );
	event.fire( function ( { tMsg, dMsg } ) {
		dcBot.channels.cache.get( DCREVCHN ).send( dMsg );
		tgBot.telegram.sendMessage( TGREVGRP, tMsg, {
			// eslint-disable-next-line camelcase
			parse_mode: 'Markdown',
			// eslint-disable-next-line camelcase
			disable_web_page_preview: true
		} );
	} );
}

module.exports = {
	bindEvent
};
