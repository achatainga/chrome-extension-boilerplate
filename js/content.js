if (typeof(EXT_NAME_CONTENT_SCRIPT_LOADED) == 'undefined') {
	var EXT_NAME_CONTENT_SCRIPT_LOADED = true;

	var ExtName = {};
	
	//---------------------------------------------------------------------------------------------------------------------
	ExtName.initialize = function() {
		// console.log("Initializing extension content script");

		// On document ready
		$( document ).ready( function() {
			get_deals();

			// Load CSS
			var path = chrome.extension.getURL('css/content.css');
			var link = document.createElement( 'link' );
			link.setAttribute( 'rel', 'stylesheet' );
			link.setAttribute( 'type', 'text/css' );
			link.setAttribute( 'href', path );
			document.getElementsByTagName( 'head' )[ 0 ].appendChild( link );
		} ); // End of document.ready

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
	data.append( "host", host );

	var deals    =  await make_post( "https://192.168.0.42/get_deals.php", data );
	// chrome.tabs.query( { active: true, currentWindow: true }, function( tabs ) {	
    //     chrome.tabs.sendMessage( tabs[0].id, { deals: deals }, function( response ) {
    //         var html = print_deals( response.deals );
	// 		chrome.storage.local.set( { data: { tabId: response.tabId, html: html } } );
    //     } );
	// } );
	chrome.extension.sendMessage( { deals: deals }, function( response ) {
		console.log( response );
		var html = print_deals( response.deals );
		chrome.storage.local.set( { data: { tabId: response.tabId, html: html } } );
	} );
	
}

function print_deals( deals ) {
	var html = `<h4 class="text-center">Click to copy</h4>`;
    $.each( deals, function( index, data ) {
        html +=
        `
        <div class="card">
            <div class="card-body">
                <div class="container-fluid">
					<div class="row d-flex justify-content-center">
						<h5 class="card-title">` + data.dedi_symbol + data.deal_discount_amount + `</h5>
					</div>
					<div class="row d-flex justify-content-center">` + 
						( data.deal_type == 1 ? `<a class="btn btn-success text-white deal_code" href="#" deal_code="` + data.deal_code + `">` + data.deal_code + `</a>` : `` ) +
						( data.deal_type == 2 ? `<a class="btn btn-success text-white deal_link" href="` + data.deal_link + `">Get Promotion</a>`: `` ) + `
					</div>
                </div>
            </div>
		</div>`;
	} );
	return html;
}

async function make_post( url, data ) {
    var xhttp = new XMLHttpRequest();
    xhttp.open( "POST", url, true );
    xhttp.send( data );
    return new Promise( resolve => {
        xhttp.onreadystatechange = function() {
            if ( this.readyState == 4 && this.status == 200 ) {
                var response = $.parseJSON( this.responseText );
                resolve( response );
            }
        }
    } );
}

function build_data_params( attributes, prefix ) {
    var regex = new RegExp( prefix );
    var data = new FormData();
    $.each( attributes, function() {
        // https://stackoverflow.com/questions/14645806/get-all-attributes-of-an-element-using-jquery
        if( this.specified && this.name.match( regex ) ) {
            data.append( this.name.replace( regex, "" ), this.value );
        }
    } );
    return data;
}

async function on_click_process( element, event, callback = undefined ) {
    event.preventDefault();
    var prefix      = $( element ).attr( "prefix" );
    var url         = $( element ).attr( "url" );
    var data        = build_data_params( element.attributes, prefix );
    var response    = await make_post( url, data );
    if ( callback != undefined ) {
        callback( element, response );
    }
}