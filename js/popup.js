var helpers = chrome.extension.getBackgroundPage();
$( document ).ready( function() {
    chrome.tabs.query( { currentWindow: true, active: true }, function( tabs ) {
        var currentTab = tabs[ 0 ];
        chrome.runtime.sendMessage( { host: helpers.extractHostname( currentTab.url ), action: "get_data_from_api" }, async function( response ) {
            if ( response == undefined || Object.keys( response ).length == 0 ) { return };
            console.log( response );
            $( "#loader" ).remove();
            $( "#nav_user" ).append( helpers.print_permissions( response ) );
            $( "#deals" ).append( helpers.print_deals( response ) );
            $( "#store" ).append( helpers.print_store( response ) );
            handle_load();
        } );
    } );
} );

function handle_load() {
    $( document ).ready( function() {
        document.getElementById( 'body' ).style.minWidth = "450px";
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
    $( "#store_follow_after" ).on( "click", helpers.store_follow_after );
    $( "#store_alert_after" ).on( "click", helpers.store_alert_after );
}

function print_html( data ) {
    $( "#user" ).append( data.user_html );
    $( "#deals" ).append( data.deals_html );
}