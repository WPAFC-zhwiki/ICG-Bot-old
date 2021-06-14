const $ = require( './jquery.js' );

module.exports = function ( wikitext = '', $parseHTML = $() ) {
	let delval = {
		tags: [
			// 表格
			'table',
			'tbody',
			'td',
			'tr',
			'th',
			'pre',
			// 樣式
			'style',
			// 標題常常解析出一堆亂象
			'h1',
			'h2',
			'h3',
			'h4',
			'h5',
			'h6'
		],
		ids: [
			// 小作品標籤
			'stub',
			// 目錄
			'toc'
		],
		classes: [
			// NoteTA
			'noteTA',
			// 表格
			'infobox',
			'wikitable',
			'navbox',
			// &#60;syntaxhighlight&#62;
			'mw-highlight',
			// 圖片說明
			'thumb',
			// &#60;reference /&#62;
			'reflist',
			'references',
			'reference',
			// 不印出來的
			'noprint',
			// 消歧義
			'hatnote',
			'navigation-not-searchable',
			// 目錄
			'toc',
			// edit
			'mw-editsection'
		]
	};

	let $countHTML = $parseHTML.clone();

	$countHTML.find( function () {
		let selector = '';

		delval.tags.forEach( function ( tag ) {
			selector += selector === '' ? tag : `, ${ tag }`;
		} );

		delval.ids.forEach( function ( id ) {
			selector += `, #${ id }`;
		} );

		delval.classes.forEach( function ( thisclass ) {
			selector += `, .${ thisclass }`;
		} );

		return selector;
	}() ).remove();

	let countText = $countHTML.text().replace( /\n/g, '' );

	let issues = [];
	let elements = {};

	elements.intLinks = wikitext.match( /\[\[.*?\]\]/g );
	wikitext.replace( /<ref.*?>.*?<\/ref>/gi, '' );

	let refs = {};
	refs.wt = ( wikitext.match( /<ref.*?>.*?<\/ref>/gi ) || [] ).map( ( x, i ) => [ i, x ] );
	refs.$ele = $parseHTML.find( 'ol.references' );
	elements.refs = {
		all: refs,
		default: refs.wt.filter( function ( [ _i, x ] ) {
			return !/group=/i.test( x );
		} ),
		$references: refs.$ele.filter( function ( _i, ele ) {
			return $( ele ).find( 'a' ).length;
		} ),
		$disallowed: refs.$ele.filter( function ( _i, ele ) {
			return !!$( ele ).html().match( /baike.baidu.com|百度|quora.com|toutiao.com|pincong.rocks|zhihu.com|知乎/ );
		} ),
		$unreliable: refs.$ele.filter( function ( _i, ele ) {
			return !!$( ele ).html().match( /百家[号號]|baijiahao.baidu.com|bigexam.hk|boxun.com|bowenpress.com|hkgpao.com|peopo.org|qyer.com|speakout.hk|songshuhui.net|youtube.com|youtu.be|acfun.cn|bilibili.com/ );
		} )
	};
	elements.cats = wikitext.match( /\[\[(?:[Cc]at|[Cc]ategory|分[类類]):/gi ) || [];

	let contentLen = countText.length - countText.match( /\p{L}/i ) * 0.5;
	if ( contentLen === 0 ) {
		issues.push( 'size-zero' );
	} else if ( contentLen <= 50 ) {
		issues.push( 'substub' );
	} else if ( contentLen <= 220 ) {
		issues.push( 'stub' );
	} else if ( contentLen >= 15000 ) {
		issues.push( 'lengthy' );
	}

	if ( !/\[\[|\{\{|\{\||==|<ref|''|<code|<pre|<source|\[http|\|-|\|}|^[*#]/.test( wikitext ) ) {
		issues.push( 'wikify' );
	}

	if ( elements.refs.$references.length === 0 && elements.refs.all.$ele.length === 0 ) {
		issues.push( 'unreferenced' );
	} else {
		if ( $( '<div>' ).append( elements.refs.$references ).text().length < contentLen / 200 ) {
			issues.push( 'ref-improve' );
		}

		if ( elements.refs.$disallowed.length ) {
			issues.push( 'ref-disallowed' );
		}

		if ( elements.refs.$unreliable.length ) {
			issues.push( 'ref-unreliable' );
		}

		if (
			elements.refs.$unreliable.length + elements.refs.$disallowed.length >=
			elements.refs.$references.length * 0.5
		) {
			issues.push( 'need-rs' );
		}
	}

	if ( elements.cats.length === 0 ) {
		issues.push( 'uncategorized' );
	}

	let emCnt = ( wikitext.match( /(?:''|<(?:em|i|b)>|【)(?:.*?)(?:''|<\/(?:em|i|b)>|】)/g ) || [] ).length;
	if ( emCnt > ( wikitext.match( /==(?:.*?)==/g ) || [] ).length ) {
		issues.push( 'over-emphasize' );
	}

	if (
		wikitext.split( '\n' ).filter( function ( x ) {
			return x.match( /^\s+(?!$)/ );
		} ).length &&
		$parseHTML.find( 'pre' ).filter( function ( _i, ele ) {

			let parent = $( ele ).parent().get( 0 );
			return Array.from( parent.classList ).indexOf( 'mw-0highlight' ) > -1;
		} ).length
	) {
		issues.push( 'bad-indents' );
	}

	return {
		issues,
		elements
	};
};
