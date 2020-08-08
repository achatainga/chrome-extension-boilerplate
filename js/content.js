get_deals();
async function get_deals() {
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