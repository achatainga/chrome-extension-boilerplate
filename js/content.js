if ( typeof ( EXT_NAME_CONTENT_SCRIPT_LOADED ) == 'undefined' ) {
	var EXT_NAME_CONTENT_SCRIPT_LOADED = true;

	var ExtName = {};
	
	//---------------------------------------------------------------------------------------------------------------------
	ExtName.initialize = function() {
		call_api()
		// End of initialize
	}

	//---------------------------------------------------------------------------------------------------------------------
	// Start the extension content script
	ExtName.initialize();
}

async function call_api() {
	var url = window.location.href;
	chrome.runtime.sendMessage( { url: url, action: "number_of_store_offers" }, async function( response ) {
		if ( !nullOrundefined( response ) && !isEmpty( response ) ) {
			if ( response > 0 ) {
				chrome.runtime.sendMessage( { action: "update_icon", text: response.toString(), url: url }, async function( response ) {
				} );
			}
		}
	} );
}