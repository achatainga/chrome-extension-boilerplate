if (typeof(EXT_NAME_CONTENT_SCRIPT_LOADED) == 'undefined') {
	var EXT_NAME_CONTENT_SCRIPT_LOADED = true;

	var ExtName = {};
	
	//---------------------------------------------------------------------------------------------------------------------
	ExtName.initialize = function() {
		// console.log("Initializing extension content script");
		var token;
		window.addEventListener( "message", function( event ) {
			console.log( event );
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
		// On document ready
		// $( document ).ready( function() {
			var host = window.location.host;
			// chrome.storage.local.get( "token", function( data ) {
			// 	// console.log( data );
			// } );
			if ( host == "couponifier.com" ) {
				// var user_id = JSON.parse( $( "#id_script" ).text() ).user_id;
				// if ( typeof user_id != undefined || typeof user_id != "undefined" || user_id != null || user_id != "null" ) {
				// 	chrome.storage.local.set( { "user_id": user_id } );
				// 	console.log( user_id );
				// }
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
		// } ); // End of document.ready

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
			chrome.extension.sendMessage( { host: host, token: token.token, action: "get_api_data" }, function( response ) {
				console.log( response );
			} );
		} else {
			chrome.extension.sendMessage( { host: host, action: "get_api_data" }, function( response ) {
				console.log( response );
			} )
		}
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
					<div class="row d-flex justify-content-center text-center">
						<h5 class="card-title">` + data.deal_title + `</h5>
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
	
	console.log( data );
    var xhttp = new XMLHttpRequest();
    xhttp.open( "POST", url, true );
    xhttp.send( data );
    return new Promise( resolve => {
        xhttp.onreadystatechange = function() {
            if ( this.readyState == 4 && this.status == 200 ) {
				// console.log( this.responseText );
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

function isEmpty( obj ) {
	for( var prop in obj ) {
		if( obj.hasOwnProperty( prop ) ) {
		  return false;
		}
	}
	
	return JSON.stringify( obj ) === JSON.stringify( {} );
}