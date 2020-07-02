chrome.storage.local.get( "data", async function( data ) {
    chrome.tabs.query( { currentWindow: true, active: true }, callback.bind( this, data.data ) );
    $( "#user" ).append( data.data.user_html );
    $( "#deals" ).append( data.data.deals_html );
} );


function logTabs( tabs, tabId ) {
    // tabs[0].url requires the `tabs` permission
    console.log( tabs[ 0 ].url );
    console.log( tabId );
    return tabs[ 0 ].id;
}
  
function onError( error ) {
    console.log( `Error: ${error}` );
}

function callback( data, tabs ) {
    console.log( data );
    console.log( tabs );
    var currentTab = tabs[ 0 ]; // there will be only one in this array
    console.log( currentTab ); // also has properties like currentTab.id
    if ( currentTab.id === data.tabId ) {
        return true;
    } else {
        $( "#user_actions" ).empty();
        $( "#user_actions" ).append( `<div class="col">Refreshing page to get you deals</div>` );
        setTimeout( function( host ) {
            console.log( host );
            chrome.extension.sendMessage( { action: "reload", host: host }, function( response ) {
                
                console.log( response );
                window.close();
            } );
        }, 1000, extractHostname( currentTab.url ) );
        $( "#deals" ).empty();
        return false;
    }
    
}

function copyTextToClipboard( text ) {
    if ( typeof event != "undefined" ) {
        event.preventDefault();
    }
    //https://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript
    var textArea = document.createElement( "textarea" );
  
    // Place in top-left corner of screen regardless of scroll position.
    textArea.style.position = 'fixed';
    textArea.style.top = 0;
    textArea.style.left = 0;
  
    // Ensure it has a small width and height. Setting to 1px / 1em
    // doesn't work as this gives a negative w/h on some browsers.
    textArea.style.width = '2em';
    textArea.style.height = '2em';
  
    // We don't need padding, reducing the size if it does flash render.
    textArea.style.padding = 0;
  
    // Clean up any borders.
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
  
    // Avoid flash of white box if rendered for any reason.
    textArea.style.background = 'transparent';
  
  
    textArea.value = text;
  
    document.body.appendChild( textArea );
    textArea.focus();
    textArea.select();
  
    try {
        var successful = document.execCommand( 'copy' );
        // var msg = successful ? 'successful' : 'unsuccessful';
        // // var text = document.querySelector( ".text-success" );
        // // text.innerHTML = "Code was successfully copied";
        // // $( text ).css( { display: "block" } );
        // // $( text ).fadeOut( 5000 );
        console.log( successful );
    } catch ( err ) {
        console.log( err );
    }
  
    document.body.removeChild(textArea);
}

$( document ).ready( function() {
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

function extractHostname( url ) {
    var hostname;
    //find & remove protocol (http, ftp, etc.) and get hostname

    if ( url.indexOf( "//" ) > -1 ) {
        hostname = url.split( '/' )[ 2 ];
    }
    else {
        hostname = url.split( '/' )[ 0 ];
    }

    //find & remove port number
    hostname = hostname.split( ':' )[ 0 ];
    //find & remove "?"
    hostname = hostname.split( '?' )[ 0 ];

    return hostname;
}