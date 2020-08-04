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

async function get_deals() {
	var url = window.location.href;
	chrome.runtime.sendMessage( { url: url, action: "number_of_store_offers" }, async function( response ) {
		if ( !nullOrundefined( response ) && !isEmpty( response ) ) {
			chrome.runtime.sendMessage( { action: "update_icon", text: response.toString(), url: url }, async function( response ) {
			} );
		}
	} );
}