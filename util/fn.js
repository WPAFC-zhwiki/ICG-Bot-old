/* eslint-disable no-unreachable */
const Discord = require( 'discord.js' ),
	moment = require( 'moment' ),
	fs = require( 'fs' ),
	wiki = require( 'wikijs' ).default,
	{ mwn } = require( 'mwn' ),
	{ JSDOM } = require( 'jsdom' );

const db = require( 'quick.db' );
// , logs = new db.table("Logs")

const { defaultPrefix, embedColor } = require( './config' );
const time = ( date = moment() ) => {
	return moment( date ).utcOffset( 8 ).format( 'YYYY/MM/DD HH:mm:ss' );
};

const utcTime = ( date = moment() ) => {
	return moment( date ).format( 'YYYY/MM/DD HH:mm:ss [GMT]' );
};

const ago = ( date = moment() ) => {
	return moment( date ).fromNow();
};

const embed = ( client, content ) => {
	if ( content instanceof Object ) {
		const { title, description } = content;
		return new Discord.MessageEmbed()
			.setColor( embedColor )
			.setTitle( title )
			.setDescription( description )
			.setFooter( client.user.username, client.user.avatarURL )
			.setTimestamp();
	} else if ( typeof content === 'string' ) {
		return new Discord.MessageEmbed()
			.setColor( embedColor )
			.setDescription( content )
			.setFooter( client.user.username, client.user.avatarURL )
			.setTimestamp();
	} else {
		throw Error( 'Invalid content type.\nAccepts Object or String.' );
	}
};

const deepClone = ( object ) => {
	return JSON.parse( JSON.stringify( object ) );
};

const sleep = ( ms ) => {
	return new Promise( ( resolve ) => setTimeout( resolve, ms ) );
};

const addLog = ( logid, msg, { debugchannel, debugonly } = { debugchannel: false, debugonly: false } ) => {
	return;
};

const writeLogs = ( logid ) => {
	return;
};

// eslint-disable-next-line no-shadow
const error = ( client, message, error ) => {
	return new Discord.MessageEmbed()
		.setColor( embedColor )
		.setTitle( message )
		.setDescription( `${ error }` )
		.setFooter( client.user.username, client.user.avatarURL )
		.setTimestamp();
};

const getUser = ( client, data ) => {
	if ( data instanceof Discord.User ) {
		return data;
	}
	if ( data instanceof Discord.GuildMember ) {
		return data.user;
	}
	if ( data instanceof Discord.Message ) {
		return data.author;
	}
	if ( typeof data === 'string' ) {
		return client.users.cache.find( ( user ) => user.id == data || user.tag.toLowerCase() == data.toLowerCase() );
	}
	// throw Error('Cannot find user.')
};

const getMember = ( guild, data ) => {
	if ( data instanceof Discord.User ) { return guild.members.get( data.id ); }
	if ( data instanceof Discord.GuildMember ) { return data; }
	if ( data instanceof Discord.Message ) { return data.member; }
	if ( typeof data === 'string' ) { return guild.members.cache.find( ( member ) => member.user.id == data || member.user.tag.toLowerCase() == data.toLowerCase() ); }
	// throw Error('Cannot find member.')
};

const getRole = ( guild, data ) => {
	if ( data instanceof Discord.Role ) { return data; }
	if ( typeof data === 'string' ) { return guild.roles.cache.find( ( role ) => role.name.toLowerCase() == data.toLowerCase() || role.id == data || role.name.toLowerCase().startsWith( data.toLowerCase() ) ); }
	// throw Error('Cannot find role.')
};

const getEmoji = ( client, name ) => {
	return client.emojis.cache.find( ( emoji ) => emoji.name.toLowerCase() == name.toLowerCase().replace( / /g, '_' ) );
};

const getBacklogInfo = async ( mwbot ) => {
	let list = await new mwbot.category( 'Category:正在等待審核的草稿' ).members();
	list = list.filter( ( x ) => x.title !== 'Category:正在等待审核的用户页草稿' );
	const cnt = list.length;
	const rawLvl = new JSDOM( await mwbot.parseTitle( 'Template:AFC_status/level' ) );
	const lvl = parseInt( rawLvl.window.document.querySelector( '.mw-parser-output > p' ).textContent, 10 );
	return {
		cnt,
		list,
		lvl
	};
};

/**
 *
 * @param {string} output
 * @param {string} wikitext
 * @param {{links:number,templates:number,countText:string}} data
 */
const issueChecker = ( output, wikitext, data ) => {
	const { links, templates, countText } = data;

	const issues = [];
	const elements = {};
	elements.intLinks = wikitext.match( /\[\[.*?\]\]/g );
	const refs = ( wikitext.match( /<ref.*?>.*?<\/ref>/gi ) || [] ).map( ( x, i ) => [ i, x ] );
	elements.refs = {
		all: refs,
		default: refs.filter( ( [ i, x ] ) =>
			!( /group=/i.test( x ) )
		),
		references: refs.filter( ( [ i, x ] ) =>
			!( /group=/i.test( x ) ) && (
				/https?:\/\/[^\s]*/.test( x ) ||
        /ISBN (?:(?:\d-?){10}|(?:\d-?){13})/.test( x ) ||
        /PMID \d+/.test( x ) ||
        /RFC \d+/.test( x ) ||
        /\{\{cit(?:e|ation).*?\}\}/.test( x )
			)
		),
		disallowed: refs.filter( ( [ i, x ] ) =>
			!( /group=/i.test( x ) ) && (
				/baike.baidu.com|百度|quora.com|toutiao.com|pincong.rocks|zhihu.com|知乎/.test( x )
			)
		),
		unreliable: refs.filter( ( [ i, x ] ) =>
			!( /group=/i.test( x ) ) && (
				/百家[号號]|baijiahao.baidu.com|bigexam.hk|boxun.com|bowenpress.com|hkgpao.com|peopo.org|qyer.com|speakout.hk|songshuhui.net|youtube.com|youtu.be|acfun.cn|bilibili.com/.test( x )
			)
		)
	};
	// console.log(elements.refs)
	elements.cats = wikitext.match( /\[\[:?(?:Category|分[类類]):/gi ) || [];

	// if ()
	const contentLen = countText.length - countText.match( /\p{L}/i ) * 0.5;
	if ( contentLen <= 50 ) { issues.push( 'substub' ); } else if ( contentLen <= 220 ) { issues.push( 'stub' ); } else if ( contentLen >= 15000 ) { issues.push( 'lengthy' ); }

	if ( !/\[\[|\{\{|\{\||==|<ref|''|<code|<pre|<source|\[http|\|-|\|}|^[*#]/.test( wikitext ) ) { issues.push( 'wikify' ); }

	if ( elements.refs.references.length == 0 && elements.refs.all.length == 0 ) { issues.push( 'unreferenced' ); } else {
		if ( elements.refs.references.length < contentLen / 200 ) { issues.push( 'ref-improve' ); }
		if ( elements.refs.disallowed.length ) { issues.push( 'ref-disallowed' ); }
		if ( elements.refs.unreliable.length ) { issues.push( 'ref-unreliable' ); }
	}

	if (
		elements.refs.unreliable.length + elements.refs.disallowed.length >=
    elements.refs.references.length * 0.5
	) { issues.push( 'need-rs' ); }

	if ( elements.cats.length == 0 ) { issues.push( 'uncategorized' ); }

	const em = wikitext.replace( /<ref.*?<\/ref>/gi, '' ).match( /(?:''|<(?:em|i|b)>|\{\{big|【)(?:.*?)(?:''|<\/(?:em|i|b)>|】)/g );
	// console.log(em)
	const emCnt = ( em || [] ).length;
	if ( emCnt > ( wikitext.match( /==(?:.*?)==/g ) || [] ).length ) { issues.push( 'over-emphasize' ); }

	if ( /^[ 　]+(?!$\n)/.test( wikitext ) ) { issues.push( 'bad-indents' ); }

	return {
		issues,
		elements
	};
};

module.exports = {
	time,
	utcTime,
	date: utcTime,
	ago,
	embed,
	error,
	getUser,
	getMember,
	getEmoji,
	getRole,
	// paginator,
	deepClone,
	clone: deepClone,
	sleep,
	wait: sleep,
	addLog,
	writeLogs,
	writeLog: writeLogs,
	getBacklogInfo,
	issueChecker
};

( () => {
	let optin = require( './credentials.json' );
	Object.assign( optin.mwn, {
		apiUrl: 'https://zh.wikipedia.org/w/api.php',
		defaultParams: {
			assert: 'user'
		}
	} );
	const mwbot = new mwn( optin.mwn );
	if ( optin.mwn.OAuthCredentials ) {
		mwbot.getTokensAndSiteInfo();
	} else {
		mwbot.login();
	}
	module.exports.mwbot = mwbot;
} )();
