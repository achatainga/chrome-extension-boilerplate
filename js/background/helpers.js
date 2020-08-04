//----------------------------------------------------------------------------------------------------------------------------------------------------
// Set the environment
//----------------------------------------------------------------------------------------------------------------------------------------------------
var ENVIRONMENT = 'production';
// if (chrome.runtime.id == '[CWS_EXTENSION_ID]') ENVIRONMENT = 'production'; // Chrome Web Store version

//----------------------------------------------------------------------------------------------------------------------------------------------------
// Global vars
//----------------------------------------------------------------------------------------------------------------------------------------------------
var PRINT_LOGS = false;

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
}
///////////////////////////
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

var make_post = async ( url, data ) => {
    var xhttp = new XMLHttpRequest();
    xhttp.open( "POST", url, true );
    xhttp.send( data );
    return new Promise( resolve => {
        xhttp.onreadystatechange = function() {
            if ( this.readyState == 4 && this.status == 200 ) {
                resolve( this.responseText );
            }
        }
    } );
}

var nullOrundefined = variable => {
	// console.log( variable );
	if ( typeof variable == undefined || typeof variable == "undefined" || typeof variable == null || typeof variable == "null" || variable == undefined || variable == "undefined" || variable == null || variable == "null" ) {
		// console.log( "Null or undefined" );
		return true;
	} else {
		return false;
	}
}