/* eslint-disable no-bitwise */
const each = require( './each.js' ),
	util = require( 'util' ),
	supportsColor = require( 'supports-color' );

class CreateLog {
	namespace = '';

	constructor( name, useColors = false ) {
		this.namespace = name;
		this.useColors = useColors;
		this.color = CreateLog.selectColor( this.namespace );
	}

	static colors =
		( supportsColor && ( supportsColor.stderr || supportsColor ).level >= 2 ) ?
			[
				20, 21, 26, 27, 32, 33, 38, 39, 40, 41, 42, 43, 44, 45, 56, 57, 62, 63, 68,
				69, 74, 75, 76, 77, 78, 79, 80, 81, 92, 93, 98, 99, 112, 113, 128, 129, 134,
				135, 148, 149, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172,
				173, 178, 179, 184, 185, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206,
				207, 208, 209, 214, 215, 220, 221
			] :
			[
				6, 2, 3, 4, 5, 1
			];

	static selectColor( namespace ) {
		let hash = 0;

		for ( let i = 0; i < namespace.length; i++ ) {
			hash = ( ( hash << 5 ) - hash ) + namespace.charCodeAt( i );
			hash |= 0; // Convert to 32bit integer
		}

		return this.colors[ Math.abs( hash ) % this.colors.length ];
	}

	static formatters = {
		o: function ( v ) {
			return util.inspect( v, this.inspectOpts )
				.split( '\n' )
				.map( ( str ) => str.trim() )
				.join( ' ' );
		},
		O: function ( v ) {
			return util.inspect( v, this.inspectOpts );
		}
	}

	static get TimeStamp() {
		let now = new Date();
		function s( q ) {
			return q < 10 ? `0${ q }` : `${ q }`;
		}
		return `${ now.getFullYear() }/${ s( now.getUTCMonth() + 1 ) }/${ s( now.getUTCDate() ) } ${ s( now.getUTCHours() ) }:${ s( now.getUTCMinutes() ) } (UTC)`;
	}

	static coerce( val ) {
		if ( val instanceof Error ) {
			return val.stack || val.message;
		}
		return val;
	}

	formatArgs( args ) {
		const { namespace: name, useColors } = this;

		if ( useColors ) {
			const c = this.color;
			const colorCode = '\x1b[36m[Modules] [LinkBot]\x1b[0m \u001B[3' + ( c < 8 ? c : '8;5;' + c );
			const prefix = `${ colorCode };1m[${ name }] \u001B[0m`;

			args[ 0 ] = CreateLog.TimeStamp + ' ' + prefix + args[ 0 ].split( '\n' ).join( '\n' + prefix );
			args.push( colorCode + '\u001B[0m' );
		} else {
			args[ 0 ] = CreateLog.TimeStamp + ' [' + name + '] ' + args[ 0 ];
		}
	}

	log( ...args ) {
		const self = this;

		args[ 0 ] = CreateLog.coerce( args[ 0 ] );

		if ( typeof args[ 0 ] !== 'string' ) {
			args.unshift( '%O' );
		}

		let index = 0;
		args[ 0 ] = args[ 0 ].replace( /%([a-zA-Z%])/g, ( match, format ) => {
			if ( match === '%%' ) {
				return '%';
			}
			index++;
			const formatter = CreateLog.formatters[ format ];
			if ( typeof formatter === 'function' ) {
				const val = args[ index ];
				match = formatter.call( self, val );

				args.splice( index, 1 );
				index--;
			}
			return match;
		} );

		this.formatArgs( args );

		console.log.apply( console, args );
	}
}

module.exports = class log {
	constructor( file ) {
		this.log = new CreateLog( 'worker.' + file, true );
	}

	static toString( $v ) {
		let $ret = [];

		each( $v, function ( $j ) {
			if ( $j === 'extend' ) {
				return;
			}
			$ret.push( `${ $j }: ${ $v[ $j ] }` );
		} );
		return $ret.join( ', ' );
	}

	add( $messages ) {
		let $message = '';

		$message += ' ' + ( typeof $messages === 'string' ? $messages : log.toString( $messages ) );
		this.log.log( $message );
	}

	error( $messages ) {
		return this.add( null, {
			error: $messages
		} );
	}
};
