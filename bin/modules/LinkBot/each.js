const class2type = {};

function toType( obj ) {
	if ( obj == null ) {
		return String( obj );
	}

	return typeof obj === "object" ?
		class2type[ toString( obj ) ] || "object" :
		typeof obj;
}

function isArrayLike( obj ) {

	let length = !!obj && obj.length,
		type = toType( obj );

	if ( typeof obj === "function" || obj === globalThis ) {
		return false;
	}

	return type === "array" || length === 0 ||
		typeof length === "number" && length > 0 && ( length - 1 ) in obj;
}

"Boolean Number String Function Array Date RegExp Object Error Symbol".split( " " ).forEach(
	function ( name ) {
		class2type[ "[object " + name + "]" ] = name.toLowerCase();
	} );

module.exports = function each( obj, callback ) {
	let length, i = 0;

	if ( isArrayLike( obj ) ) {
		length = obj.length;
		for ( ; i < length; i++ ) {
			if ( callback.call( obj[ i ], i, obj[ i ] ) === false ) {
				break;
			}
		}
	} else {
		for ( i in obj ) {
			if ( callback.call( obj[ i ], i, obj[ i ] ) === false ) {
				break;
			}
		}
	}

	return obj;
};
