const wait = function ( ms = 0 ) {
	return new Promise( function ( resolve ) {
		setTimeout( resolve, ms );
	} );
};

module.exports = {
	wait: wait
};
