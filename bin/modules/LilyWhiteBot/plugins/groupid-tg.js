/*
 * 在 Telegram 群組中取得群組的 ID，以便於配置互聯機器人
 */
module.exports = ( pluginManager, options ) => {
	let tg = pluginManager.handlers.get( 'Telegram' );
	if ( tg ) {
		tg.addCommand( 'thisgroupid', ( context ) => {
			if ( context.isPrivate ) {
				context.reply( `YourId = ${ context.from }` );
				console.log( `\x1b[33m[Connect]\x1b[0m [groupid-tg.js] Msg #${ context.msgId }: YourId = ${ context.from }` );
			} else {
				context.reply( `GroupId = ${ context.to }` );
				console.log( `\x1b[33m[Connect]\x1b[0m [groupid-tg.js] Msg #${ context.msgId }: GroupId = ${ context.to }` );
			}
		} );
	}
};
