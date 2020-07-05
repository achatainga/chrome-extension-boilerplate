//----------------------------------------------------------------------------------------------------------------------------------------------------
// Page Initialization (initialized for all supported sites upon load)
//----------------------------------------------------------------------------------------------------------------------------------------------------

var SCRIPTS_TO_LOAD = ["libs/jquery-3.1.1.min.js", "js/content.js", "js/background/helpers.js" ];

// Load the specified file and replace all placeholders before injecting it to the client side
var getCodeForInjection = function( filename, replacements ) {
	var code = readFileFromCache( filename );
	// Replace all placeholders
	for ( var key in replacements ) {
		if ( replacements.hasOwnProperty( key ) ) {
			var val = replacements[ key ];
			// Encode \ to \\, ' to \', trim all unnecessary white space and line breaks
			val = val.replace( /\\/g, "\\\\" ).replace( /'/g, "\\'" ).replace( /[\t\n\r]+/g, ' ' );
			// Replace @@PLACEHOLDER@@ with value
			code = code.replace( '@@' + key + '@@', val );
		}
	}
	return code;
};

// Inject page.js to the tab to initialize the extension
var injectPageJsToTab = function( tab ) {
	// log( "Injecting loader script to tab " + tab.id );

	// Load all scripts
	var code = "";
	for ( var i in SCRIPTS_TO_LOAD ) {
		var script = SCRIPTS_TO_LOAD[ i ];
		code += getCodeForInjection( script, {} ) + ";\n\n";
	}

	// Inject it to page
	chrome.tabs.executeScript( tab.id, {
		code: code,
		runAt: 'document_start',
		allFrames: false // not to iframes inside
	} );
};

// Initialize the extension on the specified tab
var initializeTab = function( tab, startUpRetroactiveLoad ) {
	// Inject page.js to the tab
	injectPageJsToTab( tab );
};

// Loads all assets (JS/CSS/HTML) from disk to cache
var loadAllAssetsToCache = function( debug, callback ) {
	// Load all files from disk to cache
	readFilesFromDisk(debug, SCRIPTS_TO_LOAD, function() {
		callback();
	} );
};
//----------------------------------------------------------------------------------------------------------------------------------------------------
// Initialization Helpers
//----------------------------------------------------------------------------------------------------------------------------------------------------

// Called every time a tab is updated
var onTabUpdate = function( tabId, info, tab ) {
	if (info.status == 'loading') {
		// log( "=========================" );
		// log( "Tab updated: " + getTabName(tab) + ", status: ", info );
		initializeTab( tab, false );
	}
};

// Called every time a tab is replaced
var onTabReplace = function( addedTabId, replacedTabId ) {
	logWarn( "Tab " + replacedTabId + " replaced with " + addedTabId );
	chrome.tabs.get( addedTabId, function( tab ) {
		return initializeTab( tab, false );
	} );
};

// Listen to all tab events to recognize user navigation to a supported website
var addTabListeners = function() {
	if ( !chrome.tabs.onUpdated.hasListener( onTabUpdate ) ) {
		chrome.tabs.onUpdated.addListener( onTabUpdate );
	}
	if ( !chrome.tabs.onReplaced.hasListener( onTabReplace ) ) {
		chrome.tabs.onReplaced.addListener( onTabReplace );
	}
};

// Retroactively initialize all existing tabs (e.g. when extension is first installed)
var retroactivelyInitExistingTabs = function() {
	chrome.windows.getAll({
		populate: true
	}, function( windows ) {

		// For all windows
		for ( var i = 0; i < windows.length; i++ ) {
			var currentWindow = windows[ i ];

			// For all tabs in that window
			for ( var j = 0; j < currentWindow.tabs.length; j++ ) {
				var currentTab = currentWindow.tabs[ j ];

				// Only initialize http or https pages, not ftp://, chrome:// etc.
				if ( currentTab.url.match( /(http|https):\/\//gi ) ) {
					initializeTab( currentTab, true );
				}
			}
		}
	} );
};
//----------------------------------------------------------------------------------------------------------------------------------------------------
//  Initialization
//----------------------------------------------------------------------------------------------------------------------------------------------------

// Initialize the background script
var initializeBackgroundScript = function() {
	// Load all assets (JS/HTML/CSS) from disk to cache
	loadAllAssetsToCache( true, function() {
		// Load extension to all future tabs
		addTabListeners();
		// Load extension to all existing tabs
		retroactivelyInitExistingTabs();
	} );

	setInterval( function() {
		// In dev/staging mode, reload all CSS/HTML files every second, to allow easy live development
		// without the need to reload the extension on every change
		if ( ENVIRONMENT != 'production' ) {
			loadAllAssetsToCache( false, function() {} );
		}
	}, 1000 )
};

initializeBackgroundScript();

//////////////////////////////////
chrome.runtime.onMessage.addListener( function( message, sender, sendResponse ) {
	console.log( message );
	console.log( sender );
	var Action = {
		"get_data_from_popup": get_data_from_popup,
		"get_data_from_content": get_data_from_content,
		"get_data_from_api": get_data_from_api,
		"reload": function() {
			console.log( "reloading" );
			chrome.tabs.query( { active: true, currentWindow: true }, function( tabs ) {
				chrome.tabs.update( tabs[ 0 ].id, { url: tabs[ 0 ].url } );
			} );
		}
	}
	var data = Action[ message.action ]( message, sender, sendResponse )
	console.log( data );
	
	// sendResponse( { data: data } );
	return true;
	
	// console.log( message.action );
	// var data = await Action[ message.action ]( message, sender, sendResponse );
	// console.log( data );
	// return Promise.resolve( { data: Action[ message.action ]( message, sender, sendResponse ) } );
	// sendResponse( { data: data } );
	// sendResponse( { data: Action[ message.action ]( message, sender, sendResponse ) } );
	// return new Promise.resolve( "my message" );
} );

var get_data_from_popup = async ( message, sender, sendResponse ) => {
	console.log( "GET DATA FROM POPUP" );
	chrome.tabs.query( { active: true, currentWindow: true }, async function( tabs ) {
		var data, deals, user, api_response, deals_html, user_html, deals_lenth, host;
		host = message.host;
		data = new FormData();
		data.append( "host", host );
		if ( message.hasOwnProperty( "token" ) && !isEmpty( message.token ) ) {
			data.append( "token", message.token );
		}

		api_response    =  await make_post( "https://couponifier.com/api.php", data );
		deals 			= api_response[ 0 ];
		user			= api_response[ 1 ];
		deals_lenth 	= deals.length;
		if ( host != "couponifier.com" ) {
			console.log( host );
			
			console.log( deals );
			if ( deals_lenth > 0 ) {
				console.log( deals_lenth );
				if ( nullOrundefined( deals[ 0 ].deal_id ) ) {
					console.log( "has deals" );
					user_html = ( nullOrundefined( deals[ 0 ].stor_id ) ? print_user( user, undefined, host ) : print_user( user, deals[ 0 ].stor_id, host ) );
					data = {
						user_html: user_html,
						host: host
					}
				} else {
					console.log( host );
					deals_html = print_deals( deals );
					user_html = nullOrundefined( deals[ 0 ].stor_id ) ? print_user( user, undefined, host ) : print_user( user, deals[ 0 ].stor_id, host );
					data = {
						deals_html: deals_html,
						user_html: user_html,
						host: host
					}
					chrome.browserAction.setIcon( {
						path : {
							"32": "../images/icon_active32x.png"
						},
					} );
					chrome.browserAction.setBadgeBackgroundColor( {color: "green"} );
				}
			} else {
				user_html = nullOrundefined( deals.stor_id ) ? print_user( user, undefined, host ) : print_user( user, deals.stor_id, host );
				data = {
					user_html: user_html,
					host: host
				}
			}
			
		} else {
			console.log( host );
			data = new FormData();
			data.append( "host", host );
			if ( message.hasOwnProperty( "token" ) && !isEmpty( message.token ) ) {
				data.append( "token", message.token );
			}

			user_response    =  await make_post( "https://couponifier.com/api.php", data );
			console.log( api_response );
			deals 			= api_response[ 0 ];
			user			= api_response[ 1 ];
			user_html = print_user( user, undefined, "couponifier.com" );
			data = {
				user_html: user_html,
				host: host
			}
		}
		var data_to_send = {};
		data_to_send[ message.tabId ] = data;
		console.log( data_to_send );
		chrome.storage.local.set( data_to_send );
	} );
	sendResponse( { data: true } );
	return undefined;
	if( response == undefined || Object.keys( response ).length == 0 ) return;
}

var get_data_from_content = async ( message, sender, sendResponse ) => {
	console.log( "GET DATA FROM CONTENT" );
	chrome.tabs.query( { active: true, currentWindow: true }, async function( tabs ) {
		console.log( tabs );
		console.log( "tab active = " + sender.tab.active + " sender.tab.id = " + sender.tab.id + " tabs[ 0 ].id = " + tabs[ 0 ].id );
		if ( sender.tab.active && sender.tab.id == tabs[ 0 ].id ) {
			var data, deals, user, api_response, deals_html, user_html, deals_lenth, host;
			host = message.host;
			data = new FormData();
			data.append( "host", host );
			if ( message.hasOwnProperty( "token" ) && !isEmpty( message.token ) ) {
				data.append( "token", message.token );
			}

			api_response    =  await make_post( "https://couponifier.com/api.php", data );
			console.log( api_response );
			if ( !is_login( api_response, sender.tab.id ) ) {
				return;
			}
			deals 			= api_response[ 0 ];
			user			= api_response[ 1 ];
			deals_lenth 	= deals.length;
			console.log( host );
			console.log( deals );
			console.log( deals_lenth );
			user_html = ( nullOrundefined( deals[ 0 ].stor_id ) ? print_user( user, undefined, host ) : print_user( user, deals[ 0 ].stor_id, host ) );
			deals_html = ( !nullOrundefined( deals[ 0 ].deal_id ) ? print_deals( deals ) : "" );
			data = {
				user_html: user_html,
				deals_html: deals_html,
				tabId: sender.tab.id,
				host: host
			}
			if ( host != "couponifier.com" && detectBrowser( "chrome" ) && !nullOrundefined( deals[ 0 ].deal_id ) ) {
				chrome.browserAction.setIcon( {
					path : {
						"32": "../images/icon_active32x.png"
					},
					tabId: sender.tab.id
				} );
				chrome.browserAction.setBadgeText( { text: deals_lenth.toString(), tabId: sender.tab.id } );
				chrome.browserAction.setBadgeBackgroundColor( {color: "green"} );
			} else if ( host != "couponifier.com" && detectBrowser( "firefox" ) && !nullOrundefined( deals[ 0 ].deal_id ) ) {
				browser.browserAction.setIcon( {
					path : {
						"32": "../images/icon_active32x.png"
					},
					tabId: sender.tab.id
				} );
				browser.browserAction.setBadgeText( { text: deals_lenth.toString(), tabId: sender.tab.id } );
				browser.browserAction.setBadgeBackgroundColor( {color: "green"} );
			}
			var data_to_send = {};
			data_to_send[ sender.tab.id ] = data;
			console.log( data_to_send );
			chrome.storage.local.set( data_to_send );
		}
	} );
	sendResponse( { data: 1 } );
	return undefined;
}

var get_data_from_api = async ( message, sender, sendResponse ) => {
	console.log( "GET DATA FROM API" );
	return new Promise( async ( resolve, reject ) => {
		var senderTab = ( !nullOrundefined( sender.tab ) ? sender.tab : { id: "popup", active: true } );
		var token = ( !nullOrundefined( message.token ) && !isEmpty( message.token ) ? message.token : {} );
		if ( senderTab.active ) {
			var data, deals, stor_id, deal_id, user, api_response, deals_html, user_html, deals_lenth, host;
			host = message.host;
			data = new FormData();
			data.append( "host", host );
			if ( !isEmpty( token ) ) {
				data.append( "token", token );
			}

			api_response    =  await make_post( "https://couponifier.com/api.php", data );
			console.log( api_response );
			if ( !is_login( api_response, senderTab.id ) ) {
				console.log( "here" );
				// sendResponse( { data: api_response } );
				// return;
			}
			deals 			= api_response[ 0 ];
			stor_id			= ( !nullOrundefined( deals[ 0 ] ) ? deals[ 0 ].stor_id : undefined );
			deal_id			= ( !nullOrundefined( deals[ 0 ] ) ? deals[ 0 ].deal_id : undefined );
			user			= api_response[ 1 ];
			deals_lenth 	= deals.length;
			user_html 		= print_user( user, stor_id, host );
			deals_html 		= ( !nullOrundefined( deal_id ) ? print_deals( deals ) : "" );
			console.log( host );
			console.log( deals );
			console.log( deals_lenth );
			data = {
				user_html: user_html,
				deals_html: deals_html,
				tabId: senderTab.id,
				host: host
			}
			console.log( sender );
			if ( host != "couponifier.com" && detectBrowser( "chrome" ) && !nullOrundefined( deal_id ) && !nullOrundefined( sender.tab ) ) {
				chrome.browserAction.setIcon( {
					path : {
						"32": "../images/icon_active32x.png"
					},
					tabId: senderTab.id
				} );
				chrome.browserAction.setBadgeText( { text: deals_lenth.toString(), tabId: sender.tab.id } );
				chrome.browserAction.setBadgeBackgroundColor( {color: "green"} );
			} else if ( host != "couponifier.com" && detectBrowser( "firefox" ) && !nullOrundefined( deal_id ) && !nullOrundefined( sender.tab ) ) {
				browser.browserAction.setIcon( {
					path : {
						"32": "../images/icon_active32x.png"
					},
					tabId: sender.tab.id
				} );
				browser.browserAction.setBadgeText( { text: deals_lenth.toString(), tabId: sender.tab.id } );
				browser.browserAction.setBadgeBackgroundColor( {color: "green"} );
			}
			var data_to_send = {};
			data_to_send[ senderTab.id ] = data;
			console.log( data_to_send );
			// chrome.storage.local.set( data_to_send, function() {
			// 	// sendResponse( { data: 8 } );
			// 	console.log( "storage set done" );
			// 	// sendResponse({ data: data_to_send });
			// } );
			
			// return true;
			sendResponse( { data: data_to_send } )
			resolve( data_to_send );
			// return data_to_send;
		}
	} );
	
	sendResponse( { data: 1 } );
	// return;
}

function is_login( api_response, tabID = undefined ) {
	var Switch = {
		2: ( () => {
			user_html = print_undermaintenance();
			data = {
				user_html: user_html,
				tabId: tabId,
				host: host
			}
			var data_to_send = {};
			data_to_send[ tabId ] = data;
			console.log( data_to_send );
			chrome.storage.local.set( data_to_send );
			return;
		} ),
		3: ( () => {
			chrome.storage.local.set( { token: {} } );
			return false;
		} ),
		"default": ( () => {
			return true;
		} )
	}
	return ( Switch[ api_response ] || Switch[ "default" ] )();
}