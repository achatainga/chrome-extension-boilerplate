//----------------------------------------------------------------------------------------------------------------------------------------------------
// Page Initialization (initialized for all supported sites upon load)
//----------------------------------------------------------------------------------------------------------------------------------------------------

var SCRIPTS_TO_LOAD = ["libs/jquery-3.1.1.min.js", "js/content.js"];

// Load the specified file and replace all placeholders before injecting it to the client side
var getCodeForInjection = function(filename, replacements) {
	var code = readFileFromCache(filename);
	// Replace all placeholders
	for (var key in replacements) {
		if (replacements.hasOwnProperty(key)) {
			var val = replacements[key];
			// Encode \ to \\, ' to \', trim all unnecessary white space and line breaks
			val = val.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/[\t\n\r]+/g, ' ');
			// Replace @@PLACEHOLDER@@ with value
			code = code.replace('@@' + key + '@@', val);
		}
	}
	return code;
};

// Inject page.js to the tab to initialize the extension
var injectPageJsToTab = function(tab) {
	log("Injecting loader script to tab " + tab.id);

	// Load all scripts
	var code = "";
	for (var i in SCRIPTS_TO_LOAD) {
		var script = SCRIPTS_TO_LOAD[i];
		code += getCodeForInjection(script, {}) + ";\n\n";
	}

	// Inject it to page
	chrome.tabs.executeScript(tab.id, {
		code: code,
		runAt: 'document_start',
		allFrames: false // not to iframes inside
	});
};

// Initialize the extension on the specified tab
var initializeTab = function(tab, startUpRetroactiveLoad) {
	// Inject page.js to the tab
	injectPageJsToTab(tab);
};

// Loads all assets (JS/CSS/HTML) from disk to cache
var loadAllAssetsToCache = function(debug, callback) {
	// Load all files from disk to cache
	readFilesFromDisk(debug, SCRIPTS_TO_LOAD, function() {
		callback();
	});
};
//----------------------------------------------------------------------------------------------------------------------------------------------------
// Initialization Helpers
//----------------------------------------------------------------------------------------------------------------------------------------------------

// Called every time a tab is updated
var onTabUpdate = function(tabId, info, tab) {
	if (info.status == 'loading') {
		log("=========================");
		log("Tab updated: " + getTabName(tab) + ", status: ", info);
		initializeTab(tab, false);
	}
};

// Called every time a tab is replaced
var onTabReplace = function(addedTabId, replacedTabId) {
	logWarn("Tab " + replacedTabId + " replaced with " + addedTabId);
	chrome.tabs.get(addedTabId, function(tab) {
		return initializeTab(tab, false);
	});
};

// Listen to all tab events to recognize user navigation to a supported website
var addTabListeners = function() {
	if (!chrome.tabs.onUpdated.hasListener(onTabUpdate)) {
		chrome.tabs.onUpdated.addListener(onTabUpdate);
	}
	if (!chrome.tabs.onReplaced.hasListener(onTabReplace)) {
		chrome.tabs.onReplaced.addListener(onTabReplace);
	}
};

// Retroactively initialize all existing tabs (e.g. when extension is first installed)
var retroactivelyInitExistingTabs = function() {
	chrome.windows.getAll({
		populate: true
	}, function(windows) {

		// For all windows
		for (var i = 0; i < windows.length; i++) {
			var currentWindow = windows[i];

			// For all tabs in that window
			for (var j = 0; j < currentWindow.tabs.length; j++) {
				var currentTab = currentWindow.tabs[j];

				// Only initialize http or https pages, not ftp://, chrome:// etc.
				if (currentTab.url.match(/(http|https):\/\//gi)) {
					initializeTab(currentTab, true);
				}
			}
		}
	});
};
//----------------------------------------------------------------------------------------------------------------------------------------------------
//  Initialization
//----------------------------------------------------------------------------------------------------------------------------------------------------

// Initialize the background script
var initializeBackgroundScript = function() {
	// Load all assets (JS/HTML/CSS) from disk to cache
	loadAllAssetsToCache(true, function() {
		// Load extension to all future tabs
		addTabListeners();
		// Load extension to all existing tabs
		retroactivelyInitExistingTabs();
	});

	setInterval(function() {
		// In dev/staging mode, reload all CSS/HTML files every second, to allow easy live development
		// without the need to reload the extension on every change
		if (ENVIRONMENT != 'production') {
			loadAllAssetsToCache(false, function() {});
		}
	}, 1000)
};

initializeBackgroundScript();

//////////////////////////////////
chrome.extension.onMessage.addListener( function( message, sender, sendResponse ) {
	console.log( message );
	console.log( sender );
	var Action = {
		"get_api_data": function() {
			chrome.tabs.query( { active: true, currentWindow: true }, async function( tabs ) {
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
									tabId: sender.tab.id,
									host: host
								}
							} else {
								console.log( host );
								deals_html = print_deals( deals );
								console.log( deals_html )
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
							tabId: sender.tab.id,
							host: host
						}
					}
					chrome.storage.local.set( { data: data } );
				}
			} )
		}, 
		"reload": function() {
			// if ( message.host != "couponifier.com" ) {
				console.log( "reloading" );
				chrome.tabs.query( { active: true, currentWindow: true }, function( tabs ) {
					chrome.tabs.update( tabs[ 0 ].id, { url: tabs[ 0 ].url } );
				} );
			// }
		}
	}
	Action[ message.action ]();	
	sendResponse( { data: true } );
} );

async function make_post( url, data ) {
    var xhttp = new XMLHttpRequest();
    xhttp.open( "POST", url, true );
    xhttp.send( data );
    return new Promise( resolve => {
        xhttp.onreadystatechange = function() {
            if ( this.readyState == 4 && this.status == 200 ) {
				// console.log( this.responseText );
				try {
					var response = JSON.parse( this.responseText );
				} catch (e) {
					callback("Error parsing response as JSON: ", e, "\nResponse is: " + this.responseText);
				}
                // var response = JSON.parse( this.responseText );
                resolve( response );
            }
        }
    } );
}

function isEmpty( obj ) {
	for( var prop in obj ) {
		if( obj.hasOwnProperty( prop ) ) {
		  return false;
		}
	}
	
	return JSON.stringify( obj ) === JSON.stringify( {} );
}

function print_deals( deals ) {
	if ( !nullOrundefined( deals[ 0 ].deal_id ) ) {
		var html = `<h4 class="text-center">Click to copy</h4>`;
		deals.map( function( data, index ) {
			console.log( data.deal_id );
			html +=`
			<div class="card">
				<div class="card-body">
					<div class="container-fluid">
						<div class="row d-flex justify-content-center text-center">
							<h5 class="card-title">` + data.deal_title + `</h5>
						</div>
						<div class="row d-flex justify-content-center">` + 
							( data.deal_type == 1 ? `<a class="btn btn-success text-white deal_code" href="#" deal_code="` + data.deal_code + `">` + data.deal_code + `</a>` : `` ) +
							( data.deal_type == 2 ? `<a class="btn btn-primary text-white link" href="` + ( typeof data.deal_link == undefined || typeof data.deal_link == "undefined" || data.deal_link == null || data.deal_link == "null" ? `https://couponifier.com/deals_show.php?deal=` + data.deal_id : data.deal_link ) + `">Get Promotion</a>`: `` ) + `
						</div>
					</div>
				</div>
			</div>`;
		} );
	}
	return html;
}

function print_user( user, store = undefined, host = undefined ) {
	var html = ``;
	if ( user.length > 0 ) {
		html += `
			<div class="container-fluid text-center d-flex justify-content-center p-2 flex-column">
				<div class="row no-gutters">
					<p class="col h4 text-center p-2">Hello ` + user[ 0 ].fullname + `</p>
				</div>`+ (
					host == "couponifier.com" ? 
					`<div class="row" id="user_actions">` +
						( user[0].user_type == 3 ? `
							<div class="col">
								<a class="btn btn-info text-white link" href="https://couponifier.com/submitdeal.php">Submit deal</a>
							</div>` : `` ) + 
						( user[0].user_type == 3 ? `
							<div class="col">
								<a class="btn btn-info text-white link" href="https://couponifier.com/stores_insert.php">Create Store</a>
							</div>
						` : `` ) + `
					</div>` : 
					`<div class="row" id="user_actions">` +
						( user[0].user_type == 3 && !nullOrundefined( store ) ? `
							<div class="col">
								<a class="btn btn-info text-white link" href="https://couponifier.com/submitdeal.php?step=deal&store=` + store + `">Submit deal</a>
							</div>` : `` ) + 
						( user[0].user_type == 3 && nullOrundefined( store ) ? `
							<div class="col">
								<a class="btn btn-info text-white link" href="https://couponifier.com/submitdeal.php?step=store&find=` + btoa( host ) + `">Create Store</a>
							</div>
						` : `` ) + `
					</div>`
				) + `
			</div>
			`
	} else {
		html += `<div class="d-flex justify-content-right p-2"><a class="btn btn-info text-white link" href="https://couponifier.com/login.php">Login</a></div>`;
	}
	return html;
}

function nullOrundefined( variable ) {
	console.log( variable );
	// console.log( typeof variable == undefined + " 1 " + typeof variable == "undefined" + " 2 " + typeof variable == null + " 3 " + typeof variable == "null" + " 4 " + variable == undefined + " 5 " + variable == "undefined" + " 5 " + variable == null + " 6 " + variable == "null" );
	if ( typeof variable == undefined || typeof variable == "undefined" || typeof variable == null || typeof variable == "null" || variable == undefined || variable == "undefined" || variable == null || variable == "null" ) {
		console.log( "Null or undefined" );
		return true;
	} else {
		return false;
	}
}