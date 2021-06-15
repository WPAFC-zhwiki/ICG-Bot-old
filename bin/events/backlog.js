const { CronJob } = require( 'cron' )
		, getBacklogInfo = require( '../modules/backlogInfo.js' );

module.exports = {
	name: 'backlog',
	fire: async ( send ) => {
		let backlogNotif = new CronJob( '0 0 * * * *', async () => {
			try {
				const { tMsg, dMsg } = await getBacklogInfo();

				send( {
					tMsg,
					dMsg
				} );

			} catch ( err ) {
				console.log( err );
			}
		} );
		backlogNotif.start();
	}
};
