if (typeof(EXT_NAME_CONTENT_SCRIPT_LOADED) == 'undefined') {
	var EXT_NAME_CONTENT_SCRIPT_LOADED = true;

	var ExtName = {};
	
	//---------------------------------------------------------------------------------------------------------------------
	ExtName.initialize = function() {
		console.log( "INITIALIZE" );
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
		// console.log( window.location.href );
		if ( window.location.href.includes( "submitdeal.php?step=store&find=" ) ) {
			// console.log( "yes" );
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
	// console.log( event );
	var token;
	// console.log( event.data );
	// We only accept messages from ourselves
	if ( event.source != window )
		return;

	if ( event.data.token ) {
		console.log( "event data token" );
		console.log( "Content script received message: " + event.data.token );
		token = event.data.token;
		chrome.storage.local.set( { token: token } );
	}
	if ( event.data.copyTextToClipboard ) {
		console.log( "event data copyTextToClipboard" );
		// console.log( event.data.copyTextToClipboard );

	}
	if ( event.data.reload ) {
		console.log( "event data reload" );
		// console.log( "reload received" + event.data );
		location.reload();
	}
	return
} );

async function get_deals() {
	var host = window.location.host;
	chrome.runtime.sendMessage( { host: host, action: "get_data_from_api" }, async function( response ) {
		if( response == undefined || Object.keys( response ).length == 0 ) return;
		console.log( response );
		console.log( !nullOrundefined( response ) && !isEmpty( response ) && !nullOrundefined( response.deals ) && !isEmpty( response.deals ) );
		if ( !nullOrundefined( response ) && !isEmpty( response ) && !nullOrundefined( response.deals ) && !isEmpty( response.deals ) ) {
			chrome.runtime.sendMessage( { action: "update_icon", text: response.deals.length.toString(), host: host }, async function( response ) {
				console.log( response );
			} );
		}
		// if( response == undefined || Object.keys( response ).length == 0 ) return;
		// var Switch = {
		// 	1: ( () => {
		// 		return
		// 	} ),
		// 	2: ( () => { return } ),
		// 	3: ( () => { get_deals(); } ),
		// 	"default": ( () => { return } )
		// }
		// ( Switch[ response.data ] || Switch[ 'default' ] )();
	} );
}