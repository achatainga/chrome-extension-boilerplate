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
	// console.log( message );
	// console.log( sender );
	var Action = {
		"get_data_from_popup": get_data_from_popup( message, sender, sendResponse ),
		"get_api_data2": get_data_from_content( message, sender, sendResponse ), 
		"reload": function() {
			// console.log( "reloading" );
			chrome.tabs.query( { active: true, currentWindow: true }, function( tabs ) {
				chrome.tabs.update( tabs[ 0 ].id, { url: tabs[ 0 ].url } );
			} );
		}
	}
	Action[ message.action ]();
	return sendResponse( { data: true } ); //Promise.resolve( { data: true } );
	sendResponse( { data: true } );
} );

var get_data_from_popup = async ( message, sender, sendResponse ) => {
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
			// console.log( host );
			
			// console.log( deals );
			if ( deals_lenth > 0 ) {
				// console.log( deals_lenth );
				if ( nullOrundefined( deals[ 0 ].deal_id ) ) {
					// console.log( "has deals" );
					user_html = ( nullOrundefined( deals[ 0 ].stor_id ) ? print_user( user, undefined, host ) : print_user( user, deals[ 0 ].stor_id, host ) );
					data = {
						user_html: user_html,
						host: host
					}
				} else {
					// console.log( host );
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
			// console.log( host );
			data = new FormData();
			data.append( "host", host );
			if ( message.hasOwnProperty( "token" ) && !isEmpty( message.token ) ) {
				data.append( "token", message.token );
			}

			user_response    =  await make_post( "https://couponifier.com/api.php", data );
			// console.log( api_response );
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
		// console.log( data_to_send );
		chrome.storage.local.set( data_to_send );
	} );
	sendResponse( { data: true } );
	return undefined;
	if( response == undefined || Object.keys( response ).length == 0 ) return;
}

var get_data_from_content = async ( message, sender, sendResponse ) => {
	chrome.tabs.query( { active: true, currentWindow: true }, async function( tabs ) {
		// console.log( tabs );
		// console.log( "tab active = " + sender.tab.active + " sender.tab.id = " + sender.tab.id + " tabs[ 0 ].id = " + tabs[ 0 ].id );
		if ( sender.tab.active && sender.tab.id == tabs[ 0 ].id ) {
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
				// console.log( host );
				
				// console.log( deals );
				if ( deals_lenth > 0 ) {
					// console.log( deals_lenth );
					if ( nullOrundefined( deals[ 0 ].deal_id ) ) {
						// console.log( "has deals" );
						user_html = ( nullOrundefined( deals[ 0 ].stor_id ) ? print_user( user, undefined, host ) : print_user( user, deals[ 0 ].stor_id, host ) );
						data = {
							user_html: user_html,
							tabId: sender.tab.id,
							host: host
						}
					} else {
						// console.log( host );
						deals_html = print_deals( deals );
						user_html = nullOrundefined( deals[ 0 ].stor_id ) ? print_user( user, undefined, host ) : print_user( user, deals[ 0 ].stor_id, host );
						data = {
							deals_html: deals_html,
							user_html: user_html,
							tabId: sender.tab.id,
							host: host
						}
						chrome.browserAction.setIcon( {
							path : {
								"32": "../images/icon_active32x.png"
							},
							tabId: sender.tab.id
						} );
						chrome.browserAction.setBadgeText( { text: deals_lenth.toString(), tabId: sender.tab.id } );
						chrome.browserAction.setBadgeBackgroundColor( {color: "green"} );
					}
				} else {
					user_html = nullOrundefined( deals.stor_id ) ? print_user( user, undefined, host ) : print_user( user, deals.stor_id, host );
					data = {
						user_html: user_html,
						tabId: sender.tab.id,
						host: host
					}
				}
				
			} else {
				// console.log( host );
				data = new FormData();
				data.append( "host", host );
				if ( message.hasOwnProperty( "token" ) && !isEmpty( message.token ) ) {
					data.append( "token", message.token );
				}

				user_response    =  await make_post( "https://couponifier.com/api.php", data );
				// console.log( api_response );
				deals 			= api_response[ 0 ];
				user			= api_response[ 1 ];
				user_html = print_user( user, undefined, "couponifier.com" );
				data = {
					user_html: user_html,
					tabId: sender.tab.id,
					host: host
				}
			}
			var data_to_send = {};
			data_to_send[ message.tabId ] = data;
			// console.log( data_to_send );
			chrome.storage.local.set( data_to_send );
		}
	} );
	sendResponse( { data: true } );
	return undefined;
	if( response == undefined || Object.keys( response ).length == 0 ) return;
}