//----------------------------------------------------------------------------------------------------------------------------------------------------
// Set the environment
//----------------------------------------------------------------------------------------------------------------------------------------------------
var ENVIRONMENT = 'production';
// if (chrome.runtime.id == '[CWS_EXTENSION_ID]') ENVIRONMENT = 'production'; // Chrome Web Store version

//----------------------------------------------------------------------------------------------------------------------------------------------------
// Global vars
//----------------------------------------------------------------------------------------------------------------------------------------------------
var PRINT_LOGS = true;

//----------------------------------------------------------------------------------------------------------------------------------------------------
// Helper functions
//----------------------------------------------------------------------------------------------------------------------------------------------------
// Get tab name: helper method for debug prints
var getTabName = function( tab ) {
	return tab.id + ' "' + tab.url.substr(0, 135).replace('https://', '').replace('http://', '') + '...' + '"';
};

// Logging helpers
var log = function() {
	if ( PRINT_LOGS ) console.log.apply( console, arguments );
};
var logWarn = function() {
	if ( PRINT_LOGS ) console.warn.apply( console, arguments );
};
var logError = function() {
	if ( PRINT_LOGS ) console.error.apply( console, arguments );
};
var logTime = function() {
	if ( PRINT_LOGS ) console.time.apply( console, arguments );
};
var logTimeEnd = function() {
	if ( PRINT_LOGS ) console.timeEnd.apply( console, arguments );
};

// Parse the specified URL into host, path, hash, etc.
var parseUrl = function( url ) {
	var parser = document.createElement( 'a' );
	parser.href = url;
	return parser;
	// e.g. {protocol: "http:", host: "abc.com:3000", hostname: "abc.com", port: "3000", pathname: "/path/", search: "?search=test", hash: "#hash"}
};

// Send an HTTP POST request expecting a JSON response
var sendHttpPostRequest = function( url, params, callback ) {
	var kvps = [];
	for ( var k in params ) {
		var v = params[ k ];
		kvps.push( encodeURIComponent( k ) + "=" + encodeURIComponent( v ) );
	}
	var paramsString = kvps.join( "&" );

	var xhr = new XMLHttpRequest();
	xhr.open( "POST", url, true );
	xhr.setRequestHeader( "Content-type", "application/x-www-form-urlencoded" );
	xhr.onreadystatechange = function() {
		if ( xhr.readyState == 4 ) {
			if ( xhr.status == 200 ) {
				var resp = null;
				// JSON.parse does not evaluate the attacker's scripts.
				try {
					var resp = JSON.parse( xhr.responseText );
				} catch ( e ) {
					callback( "Error parsing response as JSON: ", e, "\nResponse is: " + xhr.responseText );
				}
				if ( resp ) callback( null, resp );
			} else {
				callback( xhr.status + " | " + xhr.statusText + " | " + xhr.responseText );
			}
		}
	};
	xhr.send( paramsString );
};

var nullOrundefined = variable => {
	// console.log( variable );
	if ( typeof variable == undefined || typeof variable == "undefined" || typeof variable == null || typeof variable == "null" || variable == undefined || variable == "undefined" || variable == null || variable == "null" ) {
		// console.log( "Null or undefined" );
		return true;
	} else {
		return false;
	}
}

var extractHostname = url => {
    var hostname;
    //find & remove protocol (http, ftp, etc.) and get hostname

    if ( url.indexOf( "//" ) > -1 ) {
        hostname = url.split( '/' )[ 2 ];
    }
    else {
        hostname = url.split( '/' )[ 0 ];
    }

    //find & remove port number
    hostname = hostname.split( ':' )[ 0 ];
    //find & remove "?"
    hostname = hostname.split( '?' )[ 0 ];

    return hostname;
}

var copyTextToClipboard =  text => {
    if ( typeof event != "undefined" ) {
        event.preventDefault();
    }
    //https://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript
    var textArea = document.createElement( "textarea" );
  
    // Place in top-left corner of screen regardless of scroll position.
    textArea.style.position = 'fixed';
    textArea.style.top = 0;
    textArea.style.left = 0;
  
    // Ensure it has a small width and height. Setting to 1px / 1em
    // doesn't work as this gives a negative w/h on some browsers.
    textArea.style.width = '2em';
    textArea.style.height = '2em';
  
    // We don't need padding, reducing the size if it does flash render.
    textArea.style.padding = 0;
  
    // Clean up any borders.
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
  
    // Avoid flash of white box if rendered for any reason.
    textArea.style.background = 'transparent';
  
  
    textArea.value = text;
  
    document.body.appendChild( textArea );
    textArea.focus();
    textArea.select();
  
    try {
        var successful = document.execCommand( 'copy' );
        // var msg = successful ? 'successful' : 'unsuccessful';
        // // var text = document.querySelector( ".text-success" );
        // // text.innerHTML = "Code was successfully copied";
        // // $( text ).css( { display: "block" } );
        // // $( text ).fadeOut( 5000 );
        // console.log( successful );
    } catch ( err ) {
        // console.log( err );
    }
  
    document.body.removeChild(textArea);
}

var make_post = async ( url, data ) => {
    var xhttp = new XMLHttpRequest();
    xhttp.open( "POST", url, true );
    xhttp.send( data );
    return new Promise( resolve => {
        xhttp.onreadystatechange = function() {
            if ( this.readyState == 4 && this.status == 200 ) {
				try {
					var response = JSON.parse( this.responseText );
				} catch (e) {
					callback("Error parsing response as JSON: ", e, "\nResponse is: " + this.responseText);
				}
                resolve( response );
            }
        }
    } );
}

var print_deals = ( deals ) => {
	if ( !nullOrundefined( deals ) && !isEmpty( deals ) && !nullOrundefined( deals[ 0 ].deal_id ) ) {
		var html = `<h6 class="text-center h6">Click on any deal below</h6>`;
		deals.map( function( data, index ) {
			// console.log( data.deal_id );
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

var print_store = ( stores, is_login ) => {
	var html = ``;
	stores.map( ( store ) => {
		console.log( store );
		html += `
			<div class="card m-1">
				<a id="" class="text-muted" href="https://couponifier.com/stores_show.php?store=` + store.stor_id + `&name=` + encodeURI( store.stor_name ) +`" target="_blank">
					<div class="card-header text-center" style="min-height: 50px; max-height: 50px">
						<h6 id="store_name_` + store.stor_id + `">` + store.stor_name +`</h6>
					</div>
				</a>
				<div class="card-body">
					<div class="text-center justify-content-center d-flex flex-column" style="min-height: 150px;max-height:150px" data-toggle="tooltip" data-placement="top" title="` + store.stor_name + `">
						<a href="https://couponifier.com/stores_show.php?store=` + store.stor_id + `&name=` + encodeURI( store.stor_name ) + `" target="_blank">
							<img src="` + store.logo + `" style="max-height:150px" class="img-fluid" alt="Get the best coupons, deals and promotions of ` + store.stor_name + `">
						</a>
					</div>
				</div>` + 
					(
						is_login ? 
							`
							<div class="card-footer">
								<div class="text-center justify-content-around d-flex flex-row" >
									<a href="#" style="color: ` + ( !nullOrundefined( store.followed )  && store.followed > 0 ? "#007bff" : "#6c757d" ) + `"
										id="store_follow_after"
										stor_name="` + store.stor_name + `"
										prefix="param_"
										param_stor_id="` + store.stor_id + `"                                                            
										url = "https://couponifier.com/stores_followers_insert.php"
									><i class="fas fa-heart"></i></a>
									<a href="#" style="color: ` + ( !nullOrundefined( store.alert ) && store.alert > 0 ? "#007bff" : "#6c757d" ) + `"
										id="store_alert_after"
										stor_name="` + store.stor_name + `"
										prefix="param_"
										param_stor_id="` + store.stor_id + `"
										url="https://couponifier.com/stores_alerts_insert.php"
									><i class="fas fa-bell"></i></a>
								</div>
							</div>` : ``
					) + 
			`</div>
		`;
	} );
	return html;
}

var print_user = ( user, store = undefined, host = undefined ) => {
	var html = ``;
	if ( user.length > 0 ) {
		html += (
					host == "couponifier.com" ? 
					`<div class="row" id="user_actions">` +
						( user[0].user_type == 3 ? `
							<div class="col">
								<a id="popup-button" class="btn btn-info text-white link" href="https://couponifier.com/submitdeal.php">Submit deal</a>
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
			`;
	}
	return html;
}

var isEmpty = ( obj ) => {
	for( var prop in obj ) {
		if( obj.hasOwnProperty( prop ) ) {
		  return false;
		}
	}
	
	return JSON.stringify( obj ) === JSON.stringify( {} );
}

var detectBrowser = ( type ) => {
	var browser = {
		"opera": ( () => {
			return (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
		} ),
		"firefox": ( () => {
			return typeof InstallTrigger !== 'undefined';
		} ),
		"safari": ( () => {
			return /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification));
		} ),
		"ie": ( () => {
			return /*@cc_on!@*/false || !!document.documentMode;
		} ),
		"edge": ( () => {
			return !isIE && !!window.StyleMedia;
		} ),
		"chrome": ( () => {
			return !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);
		} ),
		"edge_chromium": ( () => {
			return sChrome && (navigator.userAgent.indexOf("Edg") != -1);
		} ),
		"blink": ( () => {
			return (isChrome || isOpera) && !!window.CSS;
		} )
	}

	return browser[ type ]();
	// // Opera 8.0+
	// var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;

	// // Firefox 1.0+
	// var isFirefox = typeof InstallTrigger !== 'undefined';

	// // Safari 3.0+ "[object HTMLElementConstructor]" 
	// var isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification));

	// // Internet Explorer 6-11
	// var isIE = /*@cc_on!@*/false || !!document.documentMode;

	// // Edge 20+
	// var isEdge = !isIE && !!window.StyleMedia;

	// // Chrome 1 - 79
	// var isChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);

	// // Edge (based on chromium) detection
	// var isEdgeChromium = isChrome && (navigator.userAgent.indexOf("Edg") != -1);

	// // Blink engine detection
	// // var isBlink = (isChrome || isOpera) && !!window.CSS;



	// var output = 'Detecting browsers by ducktyping:<hr>';
	// output += 'isFirefox: ' + isFirefox + '<br>';
	// output += 'isChrome: ' + isChrome + '<br>';
	// output += 'isSafari: ' + isSafari + '<br>';
	// output += 'isOpera: ' + isOpera + '<br>';
	// output += 'isIE: ' + isIE + '<br>';
	// output += 'isEdge: ' + isEdge + '<br>';
	// output += 'isEdgeChromium: ' + isEdgeChromium + '<br>';
	// output += 'isBlink: ' + isBlink + '<br>';
	// document.body.innerHTML = output;
}

var print_undermaintenance = () => {
	var html = ``;
	html += `
		<div class="container-fluid text-center d-flex justify-content-center p-2 flex-column">
			<div class="row no-gutters d-flex justify-content-center flex-column">
				<img class="img-fluid align-self-center" src="https://couponifier.com/images/others/logo.png" alt="Couponifier logo" style="max-width: 40%;max-height:40%">
				<p class="col h6 text-center pt-2">` + user[ 0 ].fullname + `</p>
			</div>
			<div>Under Short Maintenance. Check again later</div>
		</div>`;
	return html
}

var on_click_process = async ( element, event, callback = undefined ) => {
    event.preventDefault();
    var prefix      = $( element ).attr( "prefix" );
    var url         = $( element ).attr( "url" );
    var data        = build_data_params( element.attributes, prefix );
    var response    = await make_post( url, data );
    // if ( response.hasOwnProperty( "success" ) && typeof response.success !==  "undefined" ) {
    //     var color = ( response.success.general == "active" ) ? "#007bff" : "#6c757d";
    //     $( element ).css( { color: color } );
    //     if ( callback != undefined ) {
    //         // console.log( response.success.general );
    //         callback( element, response.success.general );
    //     }
    // }
    if ( callback != undefined ) {
        // console.log( response.success.general );
        callback( element, response );
    }
}

var is_login = ( api_response, tabID = undefined ) => {
	
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
			return api_response.user.map( user => {
				return user.hasOwnProperty( "user_id" ) && !nullOrundefined( user.user_id );
				console.log( user.hasOwnProperty( "user_id" ) && !nullOrundefined( user.user_id ) );
				if ( user.hasOwnProperty( "user_id" ) && !nullOrundefined( user.user_id ) ) {
					return true;
				} else {
					return false;
				}
			} );
		} )
	}
	return ( Switch[ api_response ] || Switch[ "default" ] )();
}

var updateIcon = ( message, sender, sendResponse ) => {
	console.log( "update icon message received" );
	if ( message.host != "couponifier.com" && detectBrowser( "chrome" ) ) {
		console.log( "is chrome" );
		chrome.browserAction.setIcon( {
			path : {
				"32": "../images/icon_active32x.png"
			},
			tabId: sender.tab.id
		} );
		chrome.browserAction.setBadgeText( { text: message.text, tabId: sender.tab.id } );
		chrome.browserAction.setBadgeBackgroundColor( {color: "green"} );
	} else if ( message.host != "couponifier.com" && detectBrowser( "firefox" ) ) {
		console.log( "is firefox" );
		browser.browserAction.setIcon( {
			path : {
				"32": "../images/icon_active32x.png"
			},
			tabId: sender.tab.id
		} );
		browser.browserAction.setBadgeText( { text: message.text, tabId: sender.tab.id } );
		browser.browserAction.setBadgeBackgroundColor( {color: "green"} );
	}
	sendResponse( "updated" );
	return true;
}

var store_alert_after = ( element, response ) => {
    if ( response.hasOwnProperty( "success" ) && typeof response.success !==  "undefined" ) {
        if ( response.success.general == "active" ) {
            var color = "#007bff";
            print_flash( "Alerts for " + $( element ).attr( "stor_name" ) + " are now active!", "success" );
        } else {
            var color = "#6c757d";
            print_flash( "Alerts for " + $( element ).attr( "stor_name" ) + " are now inactive.", "info" );
        }
        $( element ).css( { color: color } );
    }
}

var store_follow_after = ( element, response ) => {
    if ( response.hasOwnProperty( "success" ) && typeof response.success !==  "undefined" ) {
        if ( response.success.general == "active" ) {
            var color = "#007bff";
            print_flash( "You are now following " + $( element ).attr( "stor_name" ), "success" );
        } else {
            var color = "#6c757d";
            print_flash( "You are no longer following " + $( element ).attr( "stor_name" ), "info" );
        }
        $( element ).css( { color: color } );
    }
}

var print_flash = ( message, type ) => {
    var flash = $( "#flash" );
    if ( flash.length > 0 ) {
        flash.remove();
    }
    var types = {
        'success': 'success',
        'error': 'danger',
        'danger': 'danger',
        'info': 'info',
        'primary': 'info',
        'secondary': 'warning',
        'warning': 'warning',
        'default': 'primary'
    }
    var xxx = 
    ( type == "success" ? `success` : 
        ( type == "info" ? `info`: 
            ( type == "warning" ? "warning" : "" )
        )
    )
    var html =
    `
    <div id="flash">
        <div class="flash alert alert-`
            + ( types[ type ] || types[ 'default' ] )+ ` alert-dismissible fade show mt-1" role="alert"
            style="
                position: fixed;
                right: 0px;
                display: none;
                z-index: 1
            "
        >
            <strong>
            </strong> ` + message + `
        </div>
    </div>
    `;
    $( html ).insertAfter( "header" );
    flash = $( ".flash" );
    var header_height = $( "header" ).height();
    var scrollTop = window.pageYOffset;
    var initialWidth = $( document ).outerWidth();
    $( flash ).css( { "margin-right": -initialWidth, top: ( scrollTop == 0 ? header_height : 0 )} )
    $( flash ).show();
    $( flash ).animate( { "margin-right": 0 } ,'fast' );
    var element = $( flash );
    setTimeout( function() {
        $( element ).animate( { "margin-right": -5000 } ,'fast' );
    }, 3000);
    setTimeout( function() {
        $( element ).parent().remove();
    }, 3200);
}