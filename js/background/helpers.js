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
	console.log( variable );
	if ( typeof variable == undefined || typeof variable == "undefined" || typeof variable == null || typeof variable == "null" || variable == undefined || variable == "undefined" || variable == null || variable == "null" ) {
		console.log( "Null or undefined" );
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
        console.log( successful );
    } catch ( err ) {
        console.log( err );
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
	if ( !nullOrundefined( deals[ 0 ].deal_id ) ) {
		var html = `<h6 class="text-center h6">Click on any deal below</h6>`;
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

var print_user = ( user, store = undefined, host = undefined ) => {
	var html = ``;
	if ( user.length > 0 ) {
		html += `
			<div class="container-fluid text-center d-flex justify-content-center p-2 flex-column">
				<div class="row no-gutters d-flex justify-content-center flex-column">
					<img class="img-fluid align-self-center" src="https://couponifier.com/images/others/logo.png" alt="Couponifier logo" style="max-width: 40%;max-height:40%">
					<p class="col h6 text-center pt-2">` + user[ 0 ].fullname + `</p>
				</div>`+ (
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
			`
	} else {
		html += `<div class="d-flex justify-content-right p-2"><a class="btn btn-info text-white link" href="https://couponifier.com/login.php">Login</a></div>`;
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