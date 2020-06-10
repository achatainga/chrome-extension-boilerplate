chrome.storage.local.get( "data", function( data ) {
    console.log( data );
    $( "#deals" ).append( data.data.html );
} );

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
    $( ".deal_link" ).on( "click", function() {
        window.open( $( this ).attr( "href" ) );
    } );
} );