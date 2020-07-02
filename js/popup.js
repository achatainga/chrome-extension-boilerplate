// Load JS
var path = chrome.extension.getURL( 'js/background/helpers.js' );
var link = document.createElement( 'script' );
link.setAttribute( 'src', path );
document.getElementsByTagName( 'head' )[ 0 ].appendChild( link );
window.addEventListener( "load", () => {
    chrome.tabs.query( { currentWindow: true, active: true }, function( tabs ) {
        var tabId = tabs[ 0 ].id;
        console.log( tabs );
        chrome.storage.local.get( "token", async function( token ) {
            if ( typeof token.token != undefined && typeof token.token != "undefined" ) {
                chrome.extension.sendMessage( { tabId: tabId.toString(), host: extractHostname( tabs[ 0 ].url ), token: token.token, action: "get_data_from_popup" }, function( response ) {
                    console.log( tabId );
                    console.log( response );
                    if ( response.data ) {
                            chrome.storage.local.get( tabId.toString(), async function( data ) {
                                $( "#user" ).empty();
                                if ( nullOrundefined( data[ tabId ] ) ) {
                                    location.reload();
                                } else {
                                    console.log( data[ tabId ] );
                                    print_html( data[ tabId ] );
                                    handle_load()
                                }
                            } );
                    }
                } );
            } else {
                chrome.extension.sendMessage( { tabId: tabId.toString(), host: extractHostname( tabs[ 0 ].url ), action: "get_data_from_popup" }, function( response ) {
                    console.log( tabId );
                    console.log( response );
                    if ( response.data ) {
                            chrome.storage.local.get( tabId.toString(), async function( data ) {
                                $( "#user" ).empty();
                                if ( nullOrundefined( data[ tabId ] ) ) {
                                    location.reload();
                                } else {
                                    console.log( data[ tabId ] );
                                    print_html( data[ tabId ] );
                                    handle_load()
                                }
                            } );
                    }
                } )
            }
        } );
    } );
} );

function handle_load() {
    $( document ).ready( function() {
        $( "#loader" ).remove();
        console.log( "I am ready" );
        $( ".deal_code" ).on( "click", function() {
            var element = $( this );
            var deal_code = $( this ).attr( "deal_code" );
            copyTextToClipboard( $( this ).attr( "deal_code" ) );
            $( this ).html( "Copied" );
            setTimeout( function(){ element.html( deal_code ) }, 3000 );
        } )
        $( ".link" ).on( "click", function() {
            window.open( $( this ).attr( "href" ) );
        } );
    } );
}

function print_html( data ) {
    $( "#user" ).append( data.user_html );
    $( "#deals" ).append( data.deals_html );
}