/* eslint-disable no-jquery/no-class-state */
const { MessageEmbed: DiscordMessageEmbed } = require( 'discord.js' ),

	$ = require( 'jquery' )( new ( require( 'jsdom' ).JSDOM )().window, true ),
	EventSource = require( 'eventsource' ),

	RTRC = new EventSource( 'https://stream.wikimedia.org/v2/stream/recentchange' );

const { mwbot } = require( '../util/init.js' ),
	{ autoreview, issuesData } = require( '../util/autoreview' );

function getReason( $e = $( '<div>' ) ) {
	if ( $e.find( 'table' ).length ) {
		$e.find( '.hide-when-compact, .date-container' ).remove();
	}
	let text = $e.text().trim();
	if ( $e.find( 'a' ) ) {
		$e.find( 'a' ).each( function ( _i, ele ) {
			text = text.replace( $( ele ).text(), `[${ $( ele ).text() }](${ ele.href.replace( /^\/w/, 'https://zh.wikipedia.org/w' ) } )` );
		} );
	}
	text = text.split( '。' )[ 0 ] + '。';

	if ( text === '。' ) {
		return '';
	}

	return text.replace( /此條目/g, '草稿' ).replace( /\n/g, '' );
}

module.exports = {
	name: 'watchlist',
	fire: async ( send ) => {
		RTRC.onmessage = async function ( event ) {
			const data = JSON.parse( event.data );
			if (
				data.wiki !== 'zhwiki' ||
				data.type !== 'categorize' ||
				data.title !== 'Category:正在等待審核的草稿'
			) {
				return;
			}

			console.log( data.user, data.comment );

			const title = data.comment.replace( /^\[\[:?([^[\]]+)\]\].*$/, '$1' );

			// if (status == "removed") return; // 稍後處理
			let { user } = data;

			let page = new mwbot.page( title );
			// console.log(page)
			let creator = await page.getCreator();
			await page.purge();
			let output = `[${ user }](https://zhwp.org/User:${ encodeURI( user ) })`;

			let wikitext = await page.text();
			let html = await mwbot.parseWikitext( wikitext, {
				title: title,
				uselang: 'zh-tw'
			} );
			let $parseHTML = $( $.parseHTML( html ) );
			let $submissionbox = $parseHTML.find( '.afc-submission-pending' ).length ?
				$parseHTML.find( '.afc-submission-pending' ).first() :
				$parseHTML.find( '.afc-submission' ).first();
			if ( !$submissionbox.length && page.namespace === 0 ) {
				output += `已接受[${ creator }](https://zhwp.org/User:${ encodeURI( creator ) })的草稿[${ title }](https://zhwp.org/${ encodeURI( title ) })`;
				let tpClass;
				try {
					let talkPage = await mwbot.read( page.getTalkPage() );
					tpClass = talkPage.revisions[ 0 ].content.match( /\|class=([^|]*?)\|/ )[ 1 ];
				} catch ( e ) {
					tpClass = '';
				}
				let cClass = '';
				switch ( tpClass ) {
					case 'B':
						cClass = '乙';
						break;
					case 'C':
						cClass = '丙';
						break;
					case 'start':
						cClass = '初';
						break;
					case 'stub':
						cClass = '小作品';
						break;
					case 'list':
						cClass = '列表';
						break;
				}
				if ( cClass.length > 0 ) {
					output += `（${ cClass }級）`;
				}
			} else if ( !$submissionbox.length && page.namespace !== 0 ) {
				output += `移除了[${ creator }](https://zhwp.org/User:${ encodeURI( creator ) })的草稿[${ title }](https://zhwp.org/${ encodeURI( title ) })的AFC模板。`;
			} else if ( $submissionbox.hasClass( 'afc-submission-pending' ) ) {
				output += '提交了';
				if ( creator !== user ) {
					output += `[${ creator }](https://zhwp.org/User:${ encodeURI( creator ) })創建的`;
				}
				output += `草稿[${ title }](https://zhwp.org/${ encodeURI( title ) })`;

				const { issues } = autoreview( wikitext, $parseHTML );

				if ( issues && issues.length > 0 ) {
					output += '\n\n*自動檢測問題*\n• ' + issues.map( ( x ) => `${ issuesData[ x ] } (${ x })` ).join( '\n• ' );
				}
			} else if ( $submissionbox.hasClass( 'afc-submission-declined' ) || $submissionbox.hasClass( 'afc-submission-rejected' ) ) {
				output += '將';
				if ( wikitext.match( /\|u=([^|]+)\|/ ) ) {
					let submituser = wikitext.match( /\|u=([^|]+)\|/ )[ 1 ];
					output += `提交者[${ submituser }](https://zhwp.org/User:${ encodeURI( submituser ) })所提交的`;
				} else {
					output += `建立者[${ creator }](https://zhwp.org/User:${ encodeURI( creator ) })的`;
				}
				output += `草稿[${ title }](https://zhwp.org/${ encodeURI( title ) })標記為`;
				if ( $submissionbox.hasClass( 'afc-submission-rejected' ) ) {
					output += '拒絕再次提交的草稿';
				} else {
					output += '仍需改善的草稿';
				}
				let reason = '，未提供理由。',
					$reasonbox = $submissionbox.find( '.afc-submission-reason-box' );
				if ( $reasonbox.children().length ) {
					reason = '，理由：';
					let reasons = [];
					$reasonbox.children().each( function ( _i, $e ) {
						if ( $( $e ).children().length > 1 && $( $e ).children() === $( $e ).children( 'table, hr' ).length ) {
							$( $e ).children().each( function ( _ei, $ee ) {
								let res = getReason( $( $ee ) );
								if ( res.length > 0 ) {
									reasons.push( getReason( $( $ee ) ) );
								}
							} );
						} else {
							reasons.push( getReason( $( $e ) ) );
						}
					} );
					reasons.forEach( function ( v, i ) {
						reason += `\n*${ i + 1 }*：${ v.trim() }`;
					} );
				}
				output += reason;
			}

			if ( output === `[${ user }](https://zhwp.org/User:${ encodeURI( user ) })` ) {
				return;
			}

			const dMsg = new DiscordMessageEmbed().setDescription( `**${ output }**` );
			const tMsg = output;

			send( {
				dMsg,
				tMsg
			} );
		};
	}
};
