const conf = require( './conf.js' ),
	log = new ( require( './console' ) )( 'parselink' ),
	articlepath = conf.articlepath,
	$limit = conf.parselimit || null;

/**
 *
 * @param {string} $msg
 * @param {Object} logs
 * @return {string}
 */
module.exports = function ( $msg, logs ) {
	/**
	 * @type {string[]}
	 */
	const ret = [];

	/**
	 * @type {RegExpMatchArray}
	 */
	let $m,
		$page = '',
		$section = '',
		$url = '';

	$msg.replace( /\[\[([^[\]])+?\]\]|{{([^{}]+?)}}/g, function ( $txt ) {
		if ( $limit && ret.length > $limit ) {
			return '<token>';
		} else if ( $limit && ret.length === $limit ) {
			ret.push( `......\n已超過解析次數上限 ${ $limit } 次，停止解析。` );
			log.add( `Warning: Refusing to parse more then ${ $limit } links.` );
			return '<token>';
		}

		if ( /^\[\[([^|#]+)(?:#([^|]+))?.*?\]\]$/.exec( $txt ) ) {
			$m = $txt.match( /^\[\[([^|#]+)(?:#([^|]+))?.*?\]\]$/ );
			$page = $m[ 1 ].trim();
			if ( $m[ 2 ] ) {
				$section = '#' + $m[ 0 ][ 2 ];
			} else {
				$section = '';
			}
			if ( $page.startsWith( '../' ) ) {
				logs.parseerror = `refused parse link like "../": "${ $page }${ $section }"`;
				console.warn( `[lib/parselink] warning: refused parse link like "../": "${ $page }${ $section }"` );
				ret.push( `[[${ $page }${ $section }]]` );
				return '<token>';
			}
			$url = `${ articlepath }${ $page }${ $section }`;
		} else if ( /^{{ *(?:subst:|safesubst:)?#(exer|if|ifeq|ifexist|ifexpr|switch|time|language|babel|invoke) *:/.exec( $txt ) ) {
			$m = $txt.match( /^{{ *(?:subst:|safesubst:)?#(exer|if|ifeq|ifexist|ifexpr|switch|time|language|babel|invoke) *:/ );
			$url = `${ articlepath }Help:解析器函数#${ $m[ 1 ] }`;
		} else if ( new RegExp( '^{{ *(?:subst:|safesubst:)?(?:CURRENTYEAR|CURRENTMONTH|CURRENTMONTHNAME|CURRENTMONTHNAMEGEN|' +
			'CURRENTMONTHABBREV|CURRENTDAY|CURRENTDAY2|CURRENTDOW|CURRENTDAYNAME|CURRENTTIME|CURRENTHOUR|CURRENTWEEK|' +
			'CURRENTTIMESTAMP|LOCALYEAR|LOCALMONTH|LOCALMONTHNAME|LOCALMONTHNAMEGEN|LOCALMONTHABBREV|LOCALDAY|LOCALDAY2|' +
			'LOCALDOW|LOCALDAYNAME|LOCALTIME|LOCALHOUR|LOCALWEEK|LOCALTIMESTAMP) .*}}$'
		).exec( $txt ) ) {
			$url = `${ articlepath }Help:魔术字#日期与时间`;
		} else if ( new RegExp( '^{{ *(?:subst:|safesubst:)?(?:SITENAME|SERVER|SERVERNAME|DIRMARK|' +
			'DIRECTIONMARK|SCRIPTPATH|CURRENTVERSION|CONTENTLANGUAGE|CONTENTLANG) .*}}$'
		).exec( $txt ) ) {
			$url = `${ articlepath }Help:魔术字#技术元数据`;
		} else if ( new RegExp( '^{{ *(?:subst:|safesubst:)?(?:REVISIONID|REVISIONDAY|REVISIONDAY2|REVISIONMONTH|' +
			'REVISIONYEAR|REVISIONTIMESTAMP|REVISIONUSER|PAGESIZE|PROTECTIONLEVEL|DISPLAYTITLE|DEFAULTSORT|DEFAULTSORTKEY|DEFAULTCATEGORYSORT)(:.+?)?}}$'
		).exec( $txt ) ) {
			$url = `${ articlepath }Help:魔术字#技术元数据`;
		} else if ( new RegExp( '^{{ *(?:subst:|safesubst:)?(?:NUMBEROFPAGES|NUMBEROFARTICLES|NUMBEROFFILES|NUMBEROFEDITS|NUMBEROFVIEWS|' +
			'NUMBEROFUSERS|NUMBEROFADMINS|NUMBEROFACTIVEUSERS|PAGESINCATEGORY|PAGESINCAT|PAGESINCATEGORY|PAGESINCATEGORY|PAGESINCATEGORY|' +
			'PAGESINCATEGORY|NUMBERINGROUP|NUMBERINGROUP|PAGESINNS|PAGESINNAMESPACE)([:|].+?)?}}$'
		).exec( $txt ) ) {
			$url = `${ articlepath }Help:魔术字#统计`;
		} else if ( new RegExp( '^{{ *(?:subst:|safesubst:)?(?:FULLPAGENAME|PAGENAME|BASEPAGENAME|SUBPAGENAME|SUBJECTPAGENAME|' +
			'TALKPAGENAME|FULLPAGENAMEE|PAGENAMEE|BASEPAGENAMEE|SUBPAGENAMEE|SUBJECTPAGENAMEE|TALKPAGENAMEE)(:.+?)?}}$'
		).exec( $txt ) ) {
			$url = `${ articlepath }Help:魔术字#页面标题`;
		} else if ( new RegExp( '^{{ *(?:subst:|safesubst:)?(?:NAMESPACE|SUBJECTSPACE|ARTICLESPACE|TALKSPACE|NAMESPACEE|' +
			'SUBJECTSPACEE|TALKSPACEE)(:.+?)?}}$'
		).exec( $txt ) ) {
			$url = `${ articlepath }Help:魔术字#命名空间`;
		} else if ( /^{{ *! *}}$/.exec( $txt ) ) {
			$url = `${ articlepath }Help:魔术字#其他`;
		} else if ( /^{{ *(localurl|fullurl|filepath|urlencode|anchorencode):.+}}$/.exec( $txt ) ) {
			$url = `${ articlepath }Help:魔术字#URL数据`;
		} else if ( /^{{ *(?:subst:|safesubst:)?ns:\d+ *}}$/.exec( $txt ) ) {
			$url = `${ articlepath }Help:魔术字#命名空间_2`;
		} else if ( new RegExp( '^{{ *(?:subst:|safesubst:)?(lc|lcfirst|uc|ucfirst' +
			'|formatnum|#dateformat|#formatdate|padleft|padright|plural):.+}}$'
		).exec( $txt ) ) {
			$url = `${ articlepath }Help:魔术字#格式`;
		} else if ( /^{{ *(plural|grammar|gender|int)(:.+)?}}$/.exec( $txt ) ) {
			$url = `${ articlepath }Help:魔术字#杂项`;
		} else if ( /^{{ *(msg|raw|msgnw|subst|safesubst)(:.+)?}}$/.exec( $txt ) ) {
			$url = `${ articlepath }Help:魔术字#杂项`;
		} else if ( /^{{ *(#language|#special|#tag)(:.+)?}}$/.exec( $txt ) ) {
			$url = `${ articlepath }Help:魔术字#杂项`;
		} else if ( /^{{ *(?:subst:|safesubst:)?([^|]+)(?:|.+)?}}$/.exec( $txt ) ) {
			$m = $txt.match( /^{{ *(?:subst:|safesubst:)?([^|]+)(?:|.+)?}}$/ );
			$page = $m[ 1 ].trim();
			$url = `${ articlepath }${ $page.startsWith( ':' ) ? $page.replace( /^:/, '' ) : `Template:${ $page }` }`;
		}
		ret.push( $url.replace( /\s/g, '_' ).replace( /\?/g, '%3F' ).replace( /!$/, '%21' ).replace( /:$/, '%3A' ) );
		return '<token>';
	} );

	if ( ret.length > 0 ) {
		logs.parse = true;
		logs.parseret = ret.join( '\\n' );
		log.add( logs );
		return ret.join( '\n' );
	}
	return null;
};
