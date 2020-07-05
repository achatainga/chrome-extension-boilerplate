// Load JS
var path = chrome.extension.getURL( 'js/background/helpers.js' );
var link = document.createElement( 'script' );
link.setAttribute( 'src', path );
document.getElementsByTagName( 'head' )[ 0 ].appendChild( link );
window.addEventListener( "load", () => {
    chrome.tabs.query( { currentWindow: true, active: true }, function( tabs ) {
        var currentTab = tabs[ 0 ];
        // console.log( tabs );
        chrome.storage.local.get( "token", async function( token ) {
            var token = ( !nullOrundefined( token.token ) && !isEmpty( token.token ) ) ? token.token : {};
            chrome.runtime.sendMessage( { host: extractHostname( currentTab.url ), token: token, action: "get_data_from_api" }, async function( response ) {
                if ( response == undefined || Object.keys( response ).length == 0 ) { return };
                console.log( response );
                if ( !nullOrundefined( response ) && !isEmpty( response ) && !nullOrundefined( response.data ) && !isEmpty( response.data ) ) {
                    print_html( response.data.popup );
                    handle_load();
                }
            } );
        } );
    } );
} );

function handle_load() {
    $( document ).ready( function() {
        document.getElementById( 'body' ).style.minWidth = "600px";
        $( "#loader" ).remove();
        // console.log( "I am ready" );
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