const Discord = require( 'discord.js' );

const { mwbot, jQuery: $ } = require( '../util/init.js' ),
	{ autoreview, issuesData } = require( '../util/autoreview' );

module.exports = {
	name: 'autoreview',
	usage: 'autoreview',
	aliases: [ '自動審閱', '自动审阅' ],
	description: '自動審閱頁面並找出可能存在的問題',
	run: async ( _client, args, reply ) => {
		if ( !args.length ) {
			reply( {
				tMsg: '請輸入頁面名稱！',
				dMsg: '請輸入頁面名稱！'
			}, true );
		}
		const title = args.join( ' ' );
		let wikitext = '';
		try {
			const page = new mwbot.page( title );
			wikitext = await page.text();
		} catch ( e ) {
			reply( {
				tMsg: `頁面[${ title }](https://zh.wikipedia.org/wiki/${ encodeURIComponent( title ) })不存在`,
				dMsg: `頁面[${ title }](https://zh.wikipedia.org/wiki/${ encodeURIComponent( title ) })不存在`
			}, true );
			return;
		}
		const html = await mwbot.parseWikitext( wikitext, {
			title: title,
			uselang: 'zh-hant'
		} );
		const $parseHTML = $( $.parseHTML( html ) ).children();

		const { issues } = autoreview( wikitext, $parseHTML );

		let output = `系統剛剛自動審閱了[${ title }](https://zhwp.org/${ encodeURI( title ) })頁面，初步`;

		if ( issues && issues.length > 0 ) {
			output += '發現可能存在以下問題：\n• ' + issues.map( ( x ) => `${ issuesData[ x ] } (${ x })` ).join( '\n• ' );
		} else {
			output += '沒有發現顯著的問題。';
		}

		const dMsg = new Discord.MessageEmbed()
			.setColor( issues && issues.length ? 'RED' : 'GREEN' )
			.setTitle( '自動審閱系統' )
			.setDescription( output )
			.setTimestamp();

		const tMsg = `*自動審閱系統*\n${ output }`;

		reply( {
			tMsg,
			dMsg
		}, false );
	}
};
