if (typeof(EXT_NAME_CONTENT_SCRIPT_LOADED) == 'undefined') {
	var EXT_NAME_CONTENT_SCRIPT_LOADED = true;

	var ExtName = {};
	
	//---------------------------------------------------------------------------------------------------------------------
	ExtName.initialize = function() {
		// Load CSS
		var path = chrome.extension.getURL('css/content.css');
		var link = document.createElement( 'link' );
		link.setAttribute( 'rel', 'stylesheet' );
		link.setAttribute( 'type', 'text/css' );
		link.setAttribute( 'href', path );
		document.getElementsByTagName( 'head' )[ 0 ].appendChild( link );
		// End of initialize
	}

	//---------------------------------------------------------------------------------------------------------------------
	// Start the extension content script
	ExtName.initialize();
	var host = window.location.host;
	if ( host == "couponifier.com" ) {
		if ( window.location.href.includes( "submitdeal.php?step=store&find=" ) ) {
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
}

window.addEventListener( "message", function( event ) {
	var token;
	// We only accept messages from ourselves
	if ( event.source != window )
		return;

	if ( event.data.token ) {
		token = event.data.token;
		chrome.storage.local.set( { token: token } );
	}
	if ( event.data.copyTextToClipboard ) {
	}
	if ( event.data.reload ) {
		location.reload();
	}
	return
} );

async function get_deals() {
	var Switch = {
		1: ( () => { return } ),
		2: ( () => { return } ),
		3: ( () => {
			chrome.storage.local.set( { token: {} } );
			get_deals(); 
		} ),
		"default": ( () => { return } )
	}
	var host = window.location.host;
	chrome.runtime.sendMessage( { host: host, action: "get_data_from_api" }, async function( response ) {
		( Switch[ response ] || Switch[ 'default' ] )();
		if ( !nullOrundefined( response ) && !isEmpty( response ) && !nullOrundefined( response.deals ) && !isEmpty( response.deals ) && response.deals.length > 0 ) {
			chrome.runtime.sendMessage( { action: "update_icon", text: response.deals.length.toString(), host: host }, async function( response ) {
			} );
		}
		
	} );
}