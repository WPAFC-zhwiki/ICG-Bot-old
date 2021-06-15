/*
 * 互聯機器人
 */
const BridgeMsg = require( './transport/BridgeMsg.js' );

const defaultMessageStyle = {
	simple: {
		message: '[{nick}] {text}',
		reply: '[{nick}] Re {reply_nick} 「{reply_text}」: {text}',
		forward: '[{nick}] Fwd {forward_nick}: {text}',
		action: '* {nick} {text}',
		notice: '< {text} >'
	},
	complex: {
		message: '[{client_short} - {nick}] {text}',
		reply: '[{client_short} - {nick}] Re {reply_nick} 「{reply_text}」: {text}',
		forward: '[{client_short} - {nick}] Fwd {forward_nick}: {text}',
		action: '* {client_short} - {nick} {text}',
		notice: '< {client_full}: {text} >'
	}
};

module.exports = ( pluginManager, options ) => {
	/*
     * 準備「郵遞員」bridge
     */
	let bridge = require( './transport/bridge.js' );
	BridgeMsg.setHandlers( pluginManager.handlers );
	bridge.BridgeMsg = BridgeMsg;
	bridge.handlers = pluginManager.handlers;
	pluginManager.global.BridgeMsg = BridgeMsg;

	/*
      理清各群之間的關係：根據已知資料，建立一對一的關係（然後將 disable 的關係去除），便於查詢。例如：

        map: {
            'irc/#channel1': {
                'qq/123123123': {
                    disabled: false,
                },
                'telegram/-123123123': {
                    disabled: false,
                }
            },
            'irc/#channel2': {
                ...
            },
            'qq/123123123': {
                'irc/#channel1': {
                    disabled: false,
                },
                ...
            },
            ...
        }
     */
	let map = {};

	let groups = options.groups || [];

	if ( groups[ 0 ] && !( groups[ 0 ] instanceof Array ) ) {
		groups = [ groups ];
	}

	for ( let group of groups ) {
		// 建立聯繫
		if ( group instanceof Array ) {
			for ( let c1 of group ) {
				let client1 = BridgeMsg.parseUID( c1 ).uid;

				if ( client1 ) {
					for ( let c2 of group ) {
						let client2 = BridgeMsg.parseUID( c2 ).uid;
						if ( client1 === client2 ) { continue; }
						if ( !map[ client1 ] ) { map[ client1 ] = {}; }

						map[ client1 ][ client2 ] = {
							disabled: false
						};
					}
				}
			}
		} else if ( typeof group === 'object' ) {
			// 舊版
			winston.warn( '* Deprecated: config.example.json changed, please update "groups" in your config.js.' );

			for ( let client1 of [ 'QQ', 'Telegram', 'IRC', 'Discord' ] ) {
				let g1 = group[ client1 ];
				if ( g1 ) {
					for ( let client2 of [ 'QQ', 'Telegram', 'IRC', 'Discord' ] ) {
						if ( client1 === client2 ) { continue; }

						let g2 = group[ client2 ];
						if ( g2 ) {
							let uid1 = `${ client1.toLowerCase() }/${ g1 }`;
							let uid2 = `${ client2.toLowerCase() }/${ g2 }`;

							if ( !map[ uid1 ] ) {
								map[ uid1 ] = {};
							}
							map[ uid1 ][ uid2 ] = {
								disabled: false
							};
						}
					}
				}
			}

			if ( group.disable ) {
				for ( let client1 in group.disable ) {
					let g1 = group[ client1 ];
					if ( !g1 ) { continue; }

					let targets = group.disable[ client1 ];
					if ( typeof targets === 'string' ) { targets = [ targets ]; }
					for ( let client2 of targets ) {
						let g2 = group[ client2 ];
						if ( !g2 ) { continue; }

						let uid1 = `${ client1.toLowerCase() }/${ g1 }`;
						let uid2 = `${ client2.toLowerCase() }/${ g2 }`;
						map[ uid1 ][ uid2 ].disabled = true;
					}
				}
			}
		}
	}

	// 移除被禁止的聯繫
	let disables = options.disables || {};
	for ( let c1 in disables ) {
		let client1 = BridgeMsg.parseUID( c1 ).uid;

		if ( client1 && map[ client1 ] ) {
			let list = disables[ c1 ];
			if ( typeof list === 'string' ) {
				list = [ list ];
			}

			for ( let c2 of list ) {
				let client2 = BridgeMsg.parseUID( c2 ).uid;
				if ( map[ client1 ][ client2 ] ) {
					map[ client1 ][ client2 ].disabled = true;
				}
			}
		}
	}

	bridge.map = map;

	// 调试日志
	console.log( '\x1b[36m[Modules] [LilyWhiteBot]\x1b[0m [transport.js] Bridge Map:' );
	for ( let client1 in map ) {
		for ( let client2 in map[ client1 ] ) {
			if ( map[ client1 ][ client2 ].disabled ) {
				console.log( `${ client1 } -X-> ${ client2 }` );
			} else {
				console.log( `${ client1 } ---> ${ client2 }` );
			}
		}
	}

	// 處理用戶端別名
	let aliases = options.aliases || {};
	let aliases2 = {};
	for ( let a in aliases ) {
		let cl = BridgeMsg.parseUID( a ).uid;
		if ( cl ) {
			let names = aliases[ a ];
			let shortname;
			let fullname;

			if ( typeof names === 'string' ) {
				shortname = fullname = names;
			} else {
				shortname = names[ 0 ];
				fullname = names[ 1 ] || shortname;
			}

			aliases2[ cl ] = {
				shortname,
				fullname
			};
		}
	}
	bridge.aliases = aliases2;

	// 默认消息样式
	if ( !options.options.messageStyle ) {
		options.options.messageStyle = defaultMessageStyle;
	}

	// 调试日志
	console.log( '\x1b[36m[Modules] [LilyWhiteBot]\x1b[0m [transport.js] Aliases:' );
	let aliasesCount = 0;
	for ( let alias in aliases2 ) {
		console.log( `\x1b[36m[Modules] [LilyWhiteBot]\x1b[0m ${ alias }: ${ aliases2[ alias ].shortname } ---> ${ aliases2[ alias ].fullname }` );
		aliasesCount++;
	}
	if ( aliasesCount === 0 ) {
		console.log( '\x1b[36m[Modules] [LilyWhiteBot]\x1b[0m None' );
	}

	// 載入各用戶端的處理程式，並連接到 bridge 中
	for ( let [ type, handler ] of pluginManager.handlers ) {
		let processor = require( `./transport/processors/${ type }.js` );
		processor.init( bridge, handler, options );
		bridge.addProcessor( type, processor );
	}

	// command：允許向互聯群中加跨群操作的命令
	// paeeye：不轉發特定開頭的訊息
	// file：處理檔案上傳
	for ( let p of [ 'command', 'paeeye', 'file' ] ) {
		require( `./transport/${ p }.js` )( bridge, options );
	}

	return bridge;
};
