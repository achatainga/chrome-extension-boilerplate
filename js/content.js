get_deals();
async function get_deals() {
	var parsed = psl.parse( extractHostname( window.location.href ) );
	var url = parsed.domain;
	chrome.runtime.sendMessage( { url: url, action: "number_of_store_offers" }, async function( response ) {
		if ( !nullOrundefined( response ) && !isEmpty( response ) ) {
			if ( response > 0 ) {
				chrome.runtime.sendMessage( { action: "update_icon", text: response.toString(), url: url }, async function( response ) {
				} );
			}
		}
	} );
}