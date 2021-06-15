const Discord = require( 'discord.js' );

const config = require( '../util/config.json' ),
	getBacklogInfo = require( '../util/backlogInfo.js' );

module.exports = {
	name: 'waitlist',
	usage: 'waitlist',
	aliases: [ '候審', '候审' ],
	description: '查看積壓狀況',
	/**
	 * @type {import('../modules/command').run}
	 */
	run: async ( _client, args, reply ) => {
		const { list } = await getBacklogInfo();
		let i = -1, len = 0, j = 0, s = 0;
		for ( let page of list ) {
			const link = `[${ page.title }](https://zhwp.org/${ page.title })\n`;
			if ( len + link.len > 2048 ) {
				j++;
				len = 0;
				s = i;
			}
			if ( j === args[ 0 ] ) {
				break;
			}
			i++;
			len += link.length;
		}

		const dMsg = new Discord.MessageEmbed()
			.setColor(
				config.embedColor
			)
			.setTitle( '候審草稿列表' )
			.setDescription(
				list.map( ( page ) => `[${ page.title }](https://zhwp.org/${ page.title.replace( / /g, '_' ) })\n` ).slice( s, i + 1 ).join( '' )
			)
			.setTimestamp()
			.setFooter( `顯示第 ${ s + 1 } 至 ${ i + 1 } 項（共 ${ list.length } 項）` );

		const tMsg = '*候審草稿列表*\n' + list.map( ( page ) => `[${ page.title }](https://zhwp.org/${ page.title.replace( / /g, '_' ).replace( /\(/g, '%28' ).replace( /\)/g, '%29' ) })\n` ).slice( s, i + 1 ).join( '' ) +
			`顯示第 ${ s + 1 } 至 ${ i + 1 } 項（共 ${ list.length } 項）`;

		reply( {
			tMsg,
			dMsg
		} );
	}
};
