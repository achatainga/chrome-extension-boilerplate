if (typeof(EXT_NAME_CONTENT_SCRIPT_LOADED) == 'undefined') {
	var EXT_NAME_CONTENT_SCRIPT_LOADED = true;

	var ExtName = {};
	
	//---------------------------------------------------------------------------------------------------------------------
	ExtName.initialize = function() {
		
		var token;
		window.addEventListener( "message", function( event ) {
			console.log( event.data );
			// We only accept messages from ourselves
			if ( event.source != window )
				return;
		
			if ( event.data.token) {
				console.log( "Content script received message: " + event.data.token );
				token = event.data.token;
				chrome.storage.local.set( { token: token } );
			}
			if ( event.data.copyTextToClipboard ) {
				console.log( event.data.copyTextToClipboard );

			}
			if ( event.data.reload ) {
				console.log( "reload received" + event.data );
				location.reload();
			}
		} );
		var host = window.location.host;
		if ( host == "couponifier.com" ) {
			console.log( window.location.href );
			if ( window.location.href.includes( "submitdeal.php?step=store&find=" ) ) {
				console.log( "yes" );
				const urlParams = new URLSearchParams( window.location.search );
				const myParam = urlParams.get( 'find' );
				$( document ).ready( function() {
					$( "#stor_find" ).val( atob( myParam ) );
				} );
			}
			get_deals();
		} else {
			get_deals();
		}
			

		// Load CSS
		var path = chrome.extension.getURL('css/content.css');
		var link = document.createElement( 'link' );
		link.setAttribute( 'rel', 'stylesheet' );
		link.setAttribute( 'type', 'text/css' );
		link.setAttribute( 'href', path );
		document.getElementsByTagName( 'head' )[ 0 ].appendChild( link );

		// Load JS
		var path = chrome.extension.getURL( 'js/background/helpers.js' );
		var link = document.createElement( 'script' );
		link.setAttribute( 'src', path );
		document.getElementsByTagName( 'head' )[ 0 ].appendChild( link );
		$( document ).ready( function() { log( path ); } );
		
		
		// End of initialize
	}

	//---------------------------------------------------------------------------------------------------------------------
	// Start the extension content script
	ExtName.initialize();
}

async function get_deals() {
	var host = window.location.host;
	console.log( host );
	var data = new FormData();
	chrome.storage.local.get( "token", async function( token ) {
		if ( typeof token.token != undefined && typeof token.token != "undefined" ) {
			chrome.extension.sendMessage( { host: host, token: token.token, action: "get_api_data2" }, function( response ) {
				console.log( response );
			} );
		} else {
			chrome.extension.sendMessage( { host: host, action: "get_api_data2" }, function( response ) {
				console.log( response );
			} )
		}
	} );
}